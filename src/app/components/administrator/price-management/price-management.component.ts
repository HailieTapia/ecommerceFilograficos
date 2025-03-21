import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, PriceVariant, PriceVariantsResponse, UpdatePriceRequest, PriceHistoryResponse, PriceHistoryEntry } from '../../services/product.service';
import { CategorieService } from '../../services/categorieService';
import { PaginationComponent } from '../pagination/pagination.component';
import { ModalComponent } from '../../../modal/modal.component';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { BulkPriceUpdateComponent } from './bulk-price-update/bulk-price-update.component'; // Importamos el nuevo componente hijo

@Component({
  selector: 'app-price-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, ModalComponent, BulkPriceUpdateComponent], // Añadimos el nuevo componente
  templateUrl: './price-management.component.html'
})
export class PriceManagementComponent implements OnInit {
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
  notification: string = '';
  isFormValid: boolean = true;

  // Nuevas propiedades para el historial
  selectedHistoryVariant: PriceVariant | null = null;
  priceHistory: PriceHistoryEntry[] = [];
  historyMessage: string = '';

  // Propiedad para gestionar las pestañas
  activeTab: 'prices' | 'bulk' = 'prices'; // Pestaña activa por defecto: "Precios de Productos"

  readonly MAX_PROFIT_MARGIN: number = 500;

  categories: { category_id: number; name: string }[] = [];

  constructor(
    private productService: ProductService,
    private categorieService: CategorieService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadVariants();
  }

  loadCategories() {
    this.categorieService.getCategories().subscribe({
      next: (response: any) => {
        this.categories = response.map((cat: any) => ({
          category_id: cat.category_id,
          name: cat.name
        }));
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.categories = [];
      }
    });
  }

  loadVariants() {
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
      error: (err) => console.error('Error loading variants:', err)
    });
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
    this.selectedVariant = variant;
    this.editProductionCost = parseFloat(variant.production_cost);
    this.editProfitMargin = parseFloat(variant.profit_margin);
    this.calculatePrice();
    this.editModal.open();
  }

  closeEditModal() {
    this.editModal.close();
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
    if (!this.selectedVariant || !this.isFormValid) return;

    const priceData: UpdatePriceRequest = {
      production_cost: this.editProductionCost,
      profit_margin: this.editProfitMargin
    };

    this.productService.updatePrice(this.selectedVariant.variant_id, priceData).subscribe({
      next: (response) => {
        this.notification = response.message;
        this.loadVariants();
        this.closeEditModal();
        setTimeout(() => this.notification = '', 3000);
      },
      error: (err) => console.error('Error updating price:', err)
    });
  }

  openHistoryModal(variant: PriceVariant) {
    this.selectedHistoryVariant = variant;
    this.productService.getPriceHistoryByVariantId(variant.variant_id).subscribe({
      next: (response: PriceHistoryResponse) => {
        this.priceHistory = response.history;
        this.historyMessage = response.message;
        this.historyModal.open();
      },
      error: (err) => {
        console.error('Error al cargar el historial de precios:', err);
        this.priceHistory = [];
        this.historyMessage = 'Error al cargar el historial';
        this.historyModal.open();
      }
    });
  }

  closeHistoryModal() {
    this.historyModal.close();
    this.selectedHistoryVariant = null;
    this.priceHistory = [];
    this.historyMessage = '';
  }

  formatPrice(value: number | string): string {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    const formatted = numericValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `$ ${formatted} MXN`;
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

  // Método para cambiar entre pestañas
  setActiveTab(tab: 'prices' | 'bulk') {
    this.activeTab = tab;
  }
}