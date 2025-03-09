import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService, StockVariant, StockVariantsResponse, UpdateStockRequest } from '../../services/product.service';
import { CategorieService } from '../../services/categorieService';
import { PaginationComponent } from '../pagination/pagination.component';
import { ModalComponent } from '../../../modal/modal.component';

@Component({
  selector: 'app-product-stock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
    ModalComponent
  ],
  templateUrl: './product-stock.component.html'
})
export class ProductStockComponent implements OnInit {
  @ViewChild('updateModal') updateModal!: ModalComponent;

  stockVariants: StockVariant[] = [];
  filteredStockVariants: StockVariant[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  selectedCategoryId: string = '';
  selectedStockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'no_stock' | '' = ''; // Añadido 'no_stock'
  allCategories: { category_id: string; name: string }[] = [];
  searchQuery: string = '';

  updateForm: FormGroup;
  selectedVariant: StockVariant | null = null;

  constructor(
    private productService: ProductService,
    private categorieService: CategorieService,
    private fb: FormBuilder
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
        console.error('Error al cargar variantes de stock:', err);
        this.stockVariants = [];
        this.filteredStockVariants = [];
        this.totalItems = 0;
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
        console.error('Error al cargar categorías:', err);
        this.allCategories = [];
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
      alert('Formulario inválido. Revisa los campos.');
      return;
    }

    const newStock = this.updateForm.value.stock;
    const newThreshold = this.updateForm.value.stock_threshold || this.selectedVariant.stock_threshold;
    const currentStock = this.selectedVariant.stock;

    if (newStock < currentStock) {
      const confirmReduce = confirm(
        `Estás reduciendo el stock de ${currentStock} a ${newStock}. ¿Estás seguro de continuar?`
      );
      if (!confirmReduce) {
        return;
      }
    }

    const confirmUpdate = confirm('¿Estás seguro de que deseas actualizar el stock y el umbral?');
    if (!confirmUpdate) {
      return;
    }

    const updateData: UpdateStockRequest = {
      variant_id: this.selectedVariant.variant_id,
      stock: newStock,
      stock_threshold: newThreshold
    };

    this.productService.updateStock(updateData).subscribe({
      next: (response) => {
        alert('Stock actualizado exitosamente');
        this.loadStockVariants();
        this.updateModal.close();
      },
      error: (err) => {
        console.error('Error al actualizar stock:', err);
        alert('Error al actualizar el stock');
      }
    });
  }

  getStatusStyle(status: string): string {
    switch (status) {
      case 'in_stock': return 'bg-green-500 text-white';
      case 'low_stock': return 'bg-yellow-500 text-white';
      case 'out_of_stock': return 'bg-red-500 text-white';
      case 'no_stock': return 'bg-gray-500 text-white'; // Estilo para 'no_stock'
      default: return 'bg-gray-500 text-white';
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
}