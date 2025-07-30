import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, PriceVariant, PriceVariantsResponse, BatchUpdatePriceRequest, BatchUpdatePriceIndividualRequest, BatchUpdatePriceIndividualVariant } from '../../../../services/product.service';
import { CategorieService } from '../../../../services/categorieService';
import { PaginationComponent } from '../../pagination/pagination.component';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-bulk-price-update',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './bulk-price-update.component.html'
})
export class BulkPriceUpdateComponent implements OnInit {
  variants: PriceVariant[] = [];
  selectedVariants: Set<number> = new Set<number>();
  totalVariants = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searchTerm = '';
  selectedCategory: string = '';
  selectedProductType: string = '';
  sortBy: 'sku' | 'calculated_price' | 'production_cost' | 'profit_margin' | 'product_name' | 'updated_at' = 'sku';
  sortOrder: 'ASC' | 'DESC' = 'ASC';

  // Para actualización uniforme
  uniformProductionCost: number | null = null;
  uniformProfitMargin: number | null = null;

  // Para actualización personalizada
  customUpdates: Map<number, { production_cost: number; profit_margin: number }> = new Map();

  updateMode: 'uniform' | 'custom' = 'uniform';
  notification: string = '';
  errorMessage: string = '';
  showConfirmDialog: boolean = false;
  pendingModeChange: 'uniform' | 'custom' | null = null;

  categories: { category_id: number; name: string }[] = [];
  readonly MAX_PROFIT_MARGIN: number = 500;
  readonly MIN_VALUE: number = 0.01;

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
        // Restaurar valores personalizados si ya estaban editados
        this.variants.forEach(variant => {
          if (this.customUpdates.has(variant.variant_id)) {
            const update = this.customUpdates.get(variant.variant_id)!;
            variant.production_cost = update.production_cost.toString();
            variant.profit_margin = update.profit_margin.toString();
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar variantes:', err);
        this.errorMessage = 'Error al cargar las variantes';
        setTimeout(() => this.errorMessage = '', 3000);
      }
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

  toggleVariantSelection(variantId: number) {
    if (this.selectedVariants.has(variantId)) {
      this.selectedVariants.delete(variantId);
      if (this.updateMode === 'custom') {
        this.customUpdates.delete(variantId);
      }
    } else {
      this.selectedVariants.add(variantId);
      if (this.updateMode === 'custom') {
        const variant = this.variants.find(v => v.variant_id === variantId);
        if (variant) {
          this.customUpdates.set(variantId, {
            production_cost: parseFloat(variant.production_cost) || this.MIN_VALUE,
            profit_margin: parseFloat(variant.profit_margin) || this.MIN_VALUE
          });
        }
      }
    }
  }
  
  toggleAllVariants(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.variants.forEach(variant => {
        this.selectedVariants.add(variant.variant_id);
        if (this.updateMode === 'custom' && !this.customUpdates.has(variant.variant_id)) {
          this.customUpdates.set(variant.variant_id, {
            production_cost: parseFloat(variant.production_cost) || this.MIN_VALUE,
            profit_margin: parseFloat(variant.profit_margin) || this.MIN_VALUE
          });
        }
      });
    } else {
      this.selectedVariants.clear();
      if (this.updateMode === 'custom') {
        this.customUpdates.clear();
      }
    }
  }

  // Verifica si hay cambios sin guardar
  hasPendingChanges(): boolean {
    if (this.updateMode === 'uniform') {
      return this.selectedVariants.size > 0 && (this.uniformProductionCost !== null || this.uniformProfitMargin !== null);
    } else {
      return this.selectedVariants.size > 0 && this.customUpdates.size > 0;
    }
  }

  setUpdateMode(mode: 'uniform' | 'custom') {
    if (this.updateMode === mode) return;

    if (this.hasPendingChanges()) {
      this.pendingModeChange = mode;
      this.showConfirmDialog = true;
    } else {
      this.performModeChange(mode);
    }
  }

  // Realiza el cambio de modo
  performModeChange(mode: 'uniform' | 'custom') {
    this.updateMode = mode;
    this.selectedVariants.clear();
    if (mode === 'custom') {
      this.uniformProductionCost = null;
      this.uniformProfitMargin = null;
    } else {
      this.customUpdates.clear();
    }
    this.showConfirmDialog = false;
    this.pendingModeChange = null;
  }

  // Maneja la confirmación del cambio de modo
  confirmModeChange(action: 'change' | 'cancel' | 'save') {
    if (action === 'cancel') {
      this.showConfirmDialog = false;
      this.pendingModeChange = null;
    } else if (action === 'change') {
      this.performModeChange(this.pendingModeChange!);
    } else if (action === 'save') {
      this.saveBulkUpdate(() => this.performModeChange(this.pendingModeChange!));
    }
  }

  updateCustomPrice(variantId: number, field: 'production_cost' | 'profit_margin', value: string) {
    const numValue = parseFloat(value) || this.MIN_VALUE;
    const update = this.customUpdates.get(variantId) || { production_cost: this.MIN_VALUE, profit_margin: this.MIN_VALUE };
    update[field] = Math.max(numValue, this.MIN_VALUE);
    if (field === 'profit_margin' && update[field] > this.MAX_PROFIT_MARGIN) {
      update[field] = this.MAX_PROFIT_MARGIN;
    }
    this.customUpdates.set(variantId, update);
  }

  calculateNewPrice(variantId: number): string {
    const update = this.customUpdates.get(variantId);
    if (!update) return this.formatPrice(0);
    const { production_cost, profit_margin } = update;
    const newPrice = production_cost * (1 + profit_margin / 100);
    return this.formatPrice(newPrice);
  }

  calculateUniformPrice(): string {
    if (this.uniformProductionCost === null || this.uniformProfitMargin === null) {
      return '--';
    }
    const productionCost = this.uniformProductionCost || this.MIN_VALUE;
    const profitMargin = this.uniformProfitMargin || this.MIN_VALUE;
    const newPrice = productionCost * (1 + profitMargin / 100);
    return this.formatPrice(newPrice);
  }

  getUniformProposedValues(variantId: number): { production_cost: string; profit_margin: string; calculated_price: string } {
    if (this.uniformProductionCost === null || this.uniformProfitMargin === null || !this.selectedVariants.has(variantId)) {
      const variant = this.variants.find(v => v.variant_id === variantId);
      return {
        production_cost: variant ? variant.production_cost : this.MIN_VALUE.toString(),
        profit_margin: variant ? variant.profit_margin : this.MIN_VALUE.toString(),
        calculated_price: variant ? variant.calculated_price : this.formatPrice(0)
      };
    }
    const productionCost = this.uniformProductionCost;
    const profitMargin = this.uniformProfitMargin;
    const newPrice = productionCost * (1 + profitMargin / 100);
    return {
      production_cost: productionCost.toFixed(2),
      profit_margin: profitMargin.toFixed(2),
      calculated_price: this.formatPrice(newPrice)
    };
  }

  // Verifica si el botón de guardar debe estar habilitado
  isSaveDisabled(): boolean {
    if (this.selectedVariants.size === 0) return true;
    if (this.updateMode === 'uniform') {
      return this.uniformProductionCost === null || this.uniformProfitMargin === null || 
             this.uniformProductionCost < this.MIN_VALUE || this.uniformProfitMargin < this.MIN_VALUE;
    }
    return this.customUpdates.size === 0;
  }

  saveBulkUpdate(callback?: () => void) {
    if (this.selectedVariants.size === 0) {
      this.errorMessage = 'Por favor, selecciona al menos una variante';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    if (this.updateMode === 'uniform') {
      if (this.uniformProductionCost === null || this.uniformProfitMargin === null) {
        this.errorMessage = 'Debe proporcionar costo de producción y margen de ganancia';
        setTimeout(() => this.errorMessage = '', 3000);
        return;
      }

      if (this.uniformProductionCost < this.MIN_VALUE || this.uniformProfitMargin < this.MIN_VALUE) {
        this.errorMessage = `El costo de producción y el margen de ganancia deben ser al menos ${this.MIN_VALUE}`;
        setTimeout(() => this.errorMessage = '', 3000);
        return;
      }

      const request: BatchUpdatePriceRequest = {
        variant_ids: Array.from(this.selectedVariants),
        production_cost: this.uniformProductionCost,
        profit_margin: this.uniformProfitMargin
      };

      this.productService.batchUpdatePrices(request).subscribe({
        next: (response) => {
          this.notification = response.message;
          this.loadVariants();
          this.selectedVariants.clear();
          this.uniformProductionCost = null;
          this.uniformProfitMargin = null;
          setTimeout(() => this.notification = '', 3000);
          if (callback) callback();
        },
        error: (err) => {
          console.error('Error al actualizar precios:', err);
          this.errorMessage = 'Error al actualizar los precios';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    } else {
      const variantsToUpdate: BatchUpdatePriceIndividualVariant[] = [];
      let hasInvalidData = false;

      this.selectedVariants.forEach(variantId => {
        const update = this.customUpdates.get(variantId);
        if (!update) {
          hasInvalidData = true;
          console.error(`No hay datos de actualización para variantId ${variantId}`);
          return;
        }

        const { production_cost, profit_margin } = update;
        if (production_cost < this.MIN_VALUE || profit_margin < this.MIN_VALUE) {
          hasInvalidData = true;
          console.error(`Valores inválidos para variantId ${variantId}: production_cost=${production_cost}, profit_margin=${profit_margin}`);
          return;
        }

        variantsToUpdate.push({
          variant_id: variantId,
          production_cost,
          profit_margin
        });
      });

      if (hasInvalidData || variantsToUpdate.length === 0) {
        this.errorMessage = `Asegúrate de que todos los campos sean al menos ${this.MIN_VALUE} y haya cambios para guardar`;
        setTimeout(() => this.errorMessage = '', 3000);
        return;
      }

      const request: BatchUpdatePriceIndividualRequest = { variants: variantsToUpdate };

      this.productService.batchUpdatePricesIndividual(request).subscribe({
        next: (response) => {
          this.notification = response.message;
          this.loadVariants();
          this.selectedVariants.clear();
          this.customUpdates.clear();
          setTimeout(() => this.notification = '', 3000);
          if (callback) callback();
        },
        error: (err) => {
          console.error('Error al actualizar precios personalizados:', err);
          this.errorMessage = err.error?.message || 'Error al actualizar los precios personalizados';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  clearSelection() {
    this.selectedVariants.clear();
    this.customUpdates.clear();
    this.uniformProductionCost = null;
    this.uniformProfitMargin = null;
    this.errorMessage = '';
    this.notification = '';
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

  onProductionCostChange(event: Event, variantId: number) {
    const value = (event.target as HTMLInputElement).value;
    this.updateCustomPrice(variantId, 'production_cost', value);
  }
  
  onProfitMarginChange(event: Event, variantId: number) {
    const value = (event.target as HTMLInputElement).value;
    this.updateCustomPrice(variantId, 'profit_margin', value);
  }
}