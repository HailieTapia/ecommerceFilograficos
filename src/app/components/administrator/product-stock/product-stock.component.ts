import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService, StockVariant, StockVariantsResponse, UpdateStockRequest } from '../../services/product.service';
import { CategorieService } from '../../services/categorieService';
import { PaginationComponent } from '../pagination/pagination.component';
import { ModalComponent } from '../../../modal/modal.component';
import { ToastService } from '../../services/toastService';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';

// Registrar los datos de localización para español
registerLocaleData(localeEs);

@Component({
  selector: 'app-product-stock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
    ModalComponent,
    DatePipe
  ],
  templateUrl: './product-stock.component.html',
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
})
export class ProductStockComponent implements OnInit {
  @ViewChild('updateModal') updateModal!: ModalComponent;
  @ViewChild('confirmationModal') confirmationModal!: ModalComponent;

  stockVariants: StockVariant[] = [];
  filteredStockVariants: StockVariant[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  selectedCategoryId: string = '';
  selectedStockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'no_stock' | '' = '';
  allCategories: { category_id: string; name: string }[] = [];
  searchQuery: string = '';

  updateForm: FormGroup;
  selectedVariant: StockVariant | null = null;
  pendingUpdateData: UpdateStockRequest | null = null;

  constructor(
    private productService: ProductService,
    private categorieService: CategorieService,
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private toastService: ToastService
  ) {
    this.updateForm = this.fb.group({
      stock: ['', [Validators.required, Validators.min(0)]],
      stock_threshold: ['', [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadStockVariants();
    this.loadCategories();
  }

  loadStockVariants(): void {
    this.productService.getStockVariants(
      this.currentPage,
      this.itemsPerPage,
      this.selectedCategoryId ? parseInt(this.selectedCategoryId, 10) : undefined,
      this.selectedStockStatus || undefined
    ).subscribe({
      next: (response: StockVariantsResponse) => {
        this.stockVariants = response.variants;
        this.totalItems = response.total;
        this.itemsPerPage = response.pageSize;
        this.currentPage = response.page;
        this.applySearchFilter();
      },
      error: (err) => {
        this.stockVariants = [];
        this.filteredStockVariants = [];
        this.totalItems = 0;
        this.toastService.showToast('Error al cargar las variantes de stock', 'error');
      }
    });
  }

  loadCategories(): void {
    this.categorieService.getCategories().subscribe({
      next: (response: any) => {
        this.allCategories = response.map((cat: any) => ({
          category_id: cat.category_id.toString(),
          name: cat.name
        }));
      },
      error: (err) => {
        this.allCategories = [];
        this.toastService.showToast('Error al cargar las categorías', 'error');
      }
    });
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadStockVariants();
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadStockVariants();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadStockVariants();
  }

  applySearchFilter(): void {
    if (!this.searchQuery) {
      this.filteredStockVariants = [...this.stockVariants];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredStockVariants = this.stockVariants.filter(variant => {
      return (
        variant.sku.toLowerCase().includes(query) ||
        (variant.product_name?.toLowerCase() || '').includes(query) ||
        variant.stock.toString().includes(query) ||
        variant.stock_threshold.toString().includes(query)
      );
    });
  }

  onSearch(): void {
    this.applySearchFilter();
  }

  openUpdateModal(variant: StockVariant): void {
    this.selectedVariant = variant;
    this.updateForm.patchValue({
      stock: variant.stock,
      stock_threshold: variant.stock_threshold
    });
    this.updateModal.open();
  }

  saveStockUpdate(): void {
    if (this.updateForm.invalid || !this.selectedVariant) {
      this.updateForm.markAllAsTouched();
      this.toastService.showToast('Formulario inválido. Revisa los campos.', 'error');
      return;
    }

    const newStock = this.updateForm.value.stock;
    const newThreshold = this.updateForm.value.stock_threshold || this.selectedVariant.stock_threshold;

    this.pendingUpdateData = {
      variant_id: this.selectedVariant.variant_id,
      stock: newStock,
      stock_threshold: newThreshold
    };

    if (newStock < this.selectedVariant.stock) {
      this.confirmationModal.open();
    } else {
      this.performStockUpdate();
    }
  }

  confirmStockReduction(): void {
    this.performStockUpdate();
    this.confirmationModal.close();
  }

  cancelStockReduction(): void {
    this.pendingUpdateData = null;
    this.confirmationModal.close();
  }

  private performStockUpdate(): void {
    if (!this.pendingUpdateData) return;

    this.productService.updateStock(this.pendingUpdateData).subscribe({
      next: (response) => {
        this.toastService.showToast('Stock actualizado exitosamente', 'success');
        this.loadStockVariants();
        this.updateModal.close();
        this.pendingUpdateData = null;
      },
      error: (err) => {
        this.toastService.showToast('Error al actualizar el stock', 'error');
      }
    });
  }

  getStatusStyle(status: string): string {
    switch (status) {
      case 'in_stock': return 'bg-green-500 dark:bg-dark-success text-white dark:text-dark-text';
      case 'low_stock': return 'bg-yellow-500 dark:bg-yellow-600 text-white dark:text-dark-text';
      case 'out_of_stock': return 'bg-red-500 dark:bg-dark-danger text-white dark:text-dark-text';
      case 'no_stock': return 'bg-gray-500 dark:bg-gray-600 text-white dark:text-dark-text';
      default: return 'bg-gray-500 dark:bg-gray-600 text-white dark:text-dark-text';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'in_stock': return 'En stock';
      case 'low_stock': return 'Bajo';
      case 'out_of_stock': return 'Agotado';
      case 'no_stock': return 'Sin stock';
      default: return 'Desconocido';
    }
  }

  formatDate(date: string | null | undefined, withTime: boolean = false): string {
    if (!date) return 'Nunca';
    const format = withTime ? "d 'de' MMMM 'de' yyyy HH:mm" : "d 'de' MMMM 'de' yyyy";
    return this.datePipe.transform(date, format, undefined, 'es') || 'Nunca';
  }
}