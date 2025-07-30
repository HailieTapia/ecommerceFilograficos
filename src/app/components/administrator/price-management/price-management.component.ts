import { Component, OnInit, ViewChild, OnDestroy, Inject } from '@angular/core';
import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, PriceVariant, PriceVariantsResponse, UpdatePriceRequest, PriceHistoryResponse, PriceHistoryEntry } from '../../services/product.service';
import { CategorieService } from '../../services/categorieService';
import { PaginationComponent } from '../pagination/pagination.component';
import { ModalComponent } from '../../reusable/modal/modal.component';
import { ToastService } from '../../services/toastService';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { BulkPriceUpdateComponent } from './bulk-price-update/bulk-price-update.component';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';

registerLocaleData(localeEs);

@Component({
  selector: 'app-price-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, ModalComponent, BulkPriceUpdateComponent],
  templateUrl: './price-management.component.html',
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
})
export class PriceManagementComponent implements OnInit, OnDestroy {
  @ViewChild('editModal') editModal!: ModalComponent;
  @ViewChild('historyModal') historyModal!: ModalComponent;

  variants: PriceVariant[] = [];
  totalVariants = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searchTerm = '';
  selectedCategory: string = '';
  selectedProductType: string = '';
  sortBy: 'sku' | 'calculated_price' | 'production_cost' | 'profit_margin' | 'product_name' | 'updated_at' = 'sku';
  sortOrder: 'ASC' | 'DESC' = 'ASC';

  selectedVariant: PriceVariant | null = null;
  editProductionCost: number = 0;
  editProfitMargin: number = 0;
  editCalculatedPrice: string = '';
  priceError: string = '';
  isFormValid: boolean = true;

  selectedHistoryVariant: PriceVariant | null = null;
  priceHistory: PriceHistoryEntry[] = [];
  historyMessage: string = '';

  activeTab: 'prices' | 'bulk' = 'prices';

  readonly MAX_PROFIT_MARGIN: number = 500;

  categories: { category_id: number; name: string }[] = [];
  private subscriptions: Subscription = new Subscription();

  constructor(
    private productService: ProductService,
    private categorieService: CategorieService,
    private toastService: ToastService,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadVariants();
  }

  ngAfterViewInit(): void {
    if (!this.editModal || !this.historyModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadCategories() {
    this.subscriptions.add(
      this.categorieService.getCategories().subscribe({
        next: (response: any) => {
          this.categories = response.map((cat: any) => ({
            category_id: cat.category_id,
            name: cat.name
          }));
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar las categorías';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  loadVariants() {
    this.subscriptions.add(
      this.productService.getAllPriceVariants(
        this.currentPage,
        this.itemsPerPage,
        this.searchTerm,
        this.selectedCategory ? parseInt(this.selectedCategory) : undefined,
        this.selectedProductType as any,
        this.sortBy,
        this.sortOrder
      ).subscribe({
        next: (response: PriceVariantsResponse) => {
          this.variants = response.variants;
          this.totalVariants = response.total;
          this.totalPages = Math.ceil(response.total / this.itemsPerPage);
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar las variantes';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.loadVariants();
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.loadVariants();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.debounceSearch().subscribe(() => this.loadVariants());
  }

  debounceSearch() {
    return of(this.searchTerm).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(() => of(null))
    );
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadVariants();
  }

  sort(column: 'sku' | 'calculated_price' | 'production_cost' | 'profit_margin' | 'product_name' | 'updated_at') {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = column;
      this.sortOrder = 'ASC';
    }
    this.loadVariants();
  }

  openEditModal(variant: PriceVariant) {
    if (!this.editModal) {
      this.toastService.showToast('Error: Modal de edición no inicializado', 'error');
      return;
    }
    this.selectedVariant = variant;
    this.editProductionCost = parseFloat(variant.production_cost);
    this.editProfitMargin = parseFloat(variant.profit_margin);
    this.calculatePrice();
    this.editModal.modalType = 'info';
    this.editModal.title = `Editar Precio - ${variant.product_name} (SKU: ${variant.sku})`;
    this.editModal.open();
  }

  closeEditModal() {
    if (this.editModal) {
      this.editModal.close();
    }
    this.selectedVariant = null;
    this.priceError = '';
    this.isFormValid = true;
  }

  calculatePrice() {
    this.editProductionCost = parseFloat(this.editProductionCost.toFixed(2));
    this.editProfitMargin = parseFloat(this.editProfitMargin.toFixed(2));
    const calculated = this.editProductionCost * (1 + this.editProfitMargin / 100);
    this.editCalculatedPrice = this.formatPrice(calculated);
    this.validatePrice();
  }

  validatePrice() {
    if (this.editProductionCost < 0) {
      this.priceError = 'El costo de producción debe ser positivo';
      this.isFormValid = false;
      return;
    }
    if (this.editProfitMargin < 0.01 || this.editProfitMargin > this.MAX_PROFIT_MARGIN) {
      this.priceError = `El margen de ganancia debe estar entre 0.01% y ${this.MAX_PROFIT_MARGIN}%`;
      this.isFormValid = false;
      return;
    }
    const calculatedPriceNum = parseFloat(this.editCalculatedPrice.replace(/[^0-9.]/g, ''));
    if (calculatedPriceNum < this.editProductionCost) {
      this.priceError = `El precio debe ser mayor a $${this.editProductionCost.toFixed(2)}`;
      this.isFormValid = false;
      return;
    }
    this.priceError = '';
    this.isFormValid = true;
  }

  savePrice() {
    if (!this.selectedVariant || !this.isFormValid) {
      this.toastService.showToast('Formulario inválido. Revisa los campos.', 'error');
      return;
    }

    const priceData: UpdatePriceRequest = {
      production_cost: this.editProductionCost,
      profit_margin: this.editProfitMargin
    };

    this.subscriptions.add(
      this.productService.updatePrice(this.selectedVariant.variant_id, priceData).subscribe({
        next: () => {
          this.toastService.showToast('Precio actualizado exitosamente', 'success');
          this.loadVariants();
          this.closeEditModal();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al actualizar el precio';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  openHistoryModal(variant: PriceVariant) {
    if (!this.historyModal) {
      this.toastService.showToast('Error: Modal de historial no inicializado', 'error');
      return;
    }
    this.selectedHistoryVariant = variant;
    this.subscriptions.add(
      this.productService.getPriceHistoryByVariantId(variant.variant_id).subscribe({
        next: (response: PriceHistoryResponse) => {
          this.priceHistory = response.history;
          this.historyMessage = response.message || 'Historial de precios cargado';
          this.historyModal.modalType = 'default';
          this.historyModal.title = `Historial de Precios - ${variant.product_name} (SKU: ${variant.sku})`;
          this.historyModal.open();
        },
        error: (err) => {
          this.priceHistory = [];
          this.historyMessage = 'Error al cargar el historial';
          this.toastService.showToast(this.historyMessage, 'error');
          this.historyModal.modalType = 'error';
          this.historyModal.title = `Historial de Precios - ${variant.product_name} (SKU: ${variant.sku})`;
          this.historyModal.open();
        }
      })
    );
  }

  closeHistoryModal() {
    if (this.historyModal) {
      this.historyModal.close();
    }
    this.selectedHistoryVariant = null;
    this.priceHistory = [];
    this.historyMessage = '';
  }

  formatPrice(value: number | string): string {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    const formatted = numericValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `$ ${formatted} MXN`;
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return 'Nunca';

    // Handle DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      const [day, month, year] = date.split('/').map(Number);
      const parsedDate = new Date(year, month - 1, day);
      if (!isNaN(parsedDate.getTime())) {
        return this.datePipe.transform(parsedDate, "d 'de' MMMM 'de' yyyy", undefined, 'es') || 'Nunca';
      }
    }

    // Try parsing as ISO or other formats
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return this.datePipe.transform(parsedDate, "d 'de' MMMM 'de' yyyy", undefined, 'es') || 'Nunca';
    }

    return 'Nunca';
  }

  restrictInput(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', '.'];
    const isNumberKey = event.key >= '0' && event.key <= '9';
    const isAllowedSpecialKey = allowedKeys.includes(event.key);

    if (!isNumberKey && !isAllowedSpecialKey) {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement;
    const value = input.value;
    const dotIndex = value.indexOf('.');

    if (event.key === '.' && dotIndex !== -1) {
      event.preventDefault();
      return;
    }

    if (dotIndex !== -1 && value.length - dotIndex > 2 && !allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  isCalculatedPriceInvalid(): boolean {
    const calculatedPriceNum = parseFloat(this.editCalculatedPrice.replace(/[^0-9.]/g, ''));
    return calculatedPriceNum < this.editProductionCost;
  }

  setActiveTab(tab: 'prices' | 'bulk') {
    this.activeTab = tab;
  }
}