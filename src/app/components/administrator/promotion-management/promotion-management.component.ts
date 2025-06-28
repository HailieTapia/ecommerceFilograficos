import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PromotionService, Promotion, PromotionQueryParams, Variant, VariantQueryParams, PromotionData } from '../../services/promotion.service';
import { CategorieService } from '../../services/categorieService';
import { PaginationComponent } from '../pagination/pagination.component';
import { ModalComponent } from '../../../modal/modal.component';
import { ToastService } from '../../services/toastService';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';

registerLocaleData(localeEs);

@Component({
  selector: 'app-promotion-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
    ModalComponent
  ],
  templateUrl: './promotion-management.component.html',
  styleUrls: ['./promotion-management.component.css'],
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
})
export class PromotionManagementComponent implements OnInit {
  @ViewChild('promotionModal') promotionModal!: ModalComponent;

  promotions: Promotion[] = [];
  totalPromotions = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searchTerm = '';
  sortBy: 'promotion_id' | 'start_date' | 'end_date' | 'discount_value' | 'created_at' = 'promotion_id';
  sortOrder: 'ASC' | 'DESC' = 'ASC';

  promotionForm!: FormGroup;
  selectedPromotionId: number | null = null;
  availableVariants: Variant[] = [];
  filteredVariants: Variant[] = [];
  selectedVariantIds: number[] = [];
  variantSearchTerm: string = '';

  availableCategories: { category_id: number; name: string }[] = [];
  filteredCategories: { category_id: number; name: string }[] = [];
  selectedCategoryIds: number[] = [];
  categorySearchTerm: string = '';

  promotionTypeLabels = {
    quantity_discount: 'Descuento por Cantidad',
    order_count_discount: 'Descuento por Conteo de Órdenes',
    unit_discount: 'Descuento por Unidad'
  };

  minStartDate: string;

  constructor(
    private promotionService: PromotionService,
    private categorieService: CategorieService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private datePipe: DatePipe
  ) {
    this.minStartDate = new Date().toISOString().slice(0, 16);

    this.promotionForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      promotion_type: ['', Validators.required],
      discount_value: ['', [Validators.required, Validators.min(1), Validators.max(100), Validators.pattern('^[0-9]*$')]],
      min_quantity: [{ value: null, disabled: true }, Validators.min(1)],
      min_order_count: [{ value: null, disabled: true }, Validators.min(1)],
      min_unit_measure: [{ value: null, disabled: true }, Validators.min(0)],
      applies_to: ['', Validators.required],
      is_exclusive: [true],
      start_date: ['', [Validators.required, this.dateNotBeforeToday.bind(this)]],
      end_date: ['', Validators.required],
      variantIds: [[]],
      categoryIds: [[]]
    }, {
      validators: this.dateRangeValidator
    });

    this.promotionForm.get('promotion_type')?.valueChanges.subscribe(type => {
      this.toggleFieldsBasedOnType(type);
    });

    this.promotionForm.get('applies_to')?.valueChanges.subscribe(appliesTo => {
      this.toggleSelection(appliesTo);
    });
  }

  ngOnInit() {
    this.loadPromotions();
    this.loadAvailableVariants();
    this.loadAvailableCategories();
    this.setupVariantSearch();
    this.setupCategorySearch();
  }

  dateNotBeforeToday(control: any) {
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today ? { dateBeforeToday: true } : null;
  }

  dateRangeValidator(form: FormGroup) {
    const startDate = form.get('start_date')?.value;
    const endDate = form.get('end_date')?.value;
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return { invalidDateRange: true };
    }
    return null;
  }

  loadAvailableVariants() {
    const params: VariantQueryParams = {};
    this.promotionService.getAllVariants(params).subscribe({
      next: (response) => {
        this.availableVariants = response.variants;
        this.filteredVariants = [...this.availableVariants];
      },
      error: (err) => {
        this.toastService.showToast('Error al cargar las variantes', 'error');
        this.availableVariants = [];
        this.filteredVariants = [];
      }
    });
  }

  loadAvailableCategories() {
    this.categorieService.getCategories().subscribe({
      next: (response: any) => {
        this.availableCategories = response.map((cat: any) => ({
          category_id: cat.category_id,
          name: cat.name
        }));
        this.filteredCategories = [...this.availableCategories];
      },
      error: (err) => {
        this.toastService.showToast('Error al cargar las categorías', 'error');
        this.availableCategories = [];
        this.filteredCategories = [];
      }
    });
  }

  getVariantName(variantId: number): string | undefined {
    return this.availableVariants.find(v => v.variant_id === variantId)?.product_name;
  }

  getVariantImage(variantId: number): string | null | undefined {
    return this.availableVariants.find(v => v.variant_id === variantId)?.image_url;
  }

  getCategoryName(categoryId: number): string | undefined {
    return this.availableCategories.find(c => c.category_id === categoryId)?.name;
  }

  setupVariantSearch() {
    of(this.variantSearchTerm).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.filterVariants(term);
        return of(null);
      })
    ).subscribe();
  }

  setupCategorySearch() {
    of(this.categorySearchTerm).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.filterCategories(term);
        return of(null);
      })
    ).subscribe();
  }

  filterVariants(searchTerm: string) {
    if (!searchTerm) {
      this.filteredVariants = [...this.availableVariants];
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      this.filteredVariants = this.availableVariants.filter(variant =>
        variant.product_name.toLowerCase().includes(lowerTerm) || 
        variant.sku.toLowerCase().includes(lowerTerm)
      );
    }
  }

  filterCategories(searchTerm: string) {
    if (!searchTerm) {
      this.filteredCategories = [...this.availableCategories];
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      this.filteredCategories = this.availableCategories.filter(category =>
        category.name.toLowerCase().includes(lowerTerm)
      );
    }
  }

  onVariantSearchChange() {
    this.filterVariants(this.variantSearchTerm);
  }

  onCategorySearchChange() {
    this.filterCategories(this.categorySearchTerm);
  }

  toggleFieldsBasedOnType(type: string) {
    const controls = this.promotionForm.controls;
    controls['min_quantity'].disable();
    controls['min_order_count'].disable();
    controls['min_unit_measure'].disable();

    if (type === 'quantity_discount') {
      controls['min_quantity'].enable();
    } else if (type === 'order_count_discount') {
      controls['min_order_count'].enable();
    } else if (type === 'unit_discount') {
      controls['min_unit_measure'].enable();
    }
  }

  toggleSelection(appliesTo: string) {
    if (appliesTo !== 'specific_products') {
      this.selectedVariantIds = [];
      this.promotionForm.patchValue({ variantIds: [] });
    }
    if (appliesTo !== 'specific_categories') {
      this.selectedCategoryIds = [];
      this.promotionForm.patchValue({ categoryIds: [] });
    }
  }

  toggleVariant(variantId: number) {
    if (this.selectedVariantIds.includes(variantId)) {
      this.selectedVariantIds = this.selectedVariantIds.filter(id => id !== variantId);
    } else {
      this.selectedVariantIds.push(variantId);
    }
    this.promotionForm.patchValue({ variantIds: this.selectedVariantIds });
  }

  removeVariant(variantId: number) {
    this.selectedVariantIds = this.selectedVariantIds.filter(id => id !== variantId);
    this.promotionForm.patchValue({ variantIds: this.selectedVariantIds });
  }

  toggleCategory(categoryId: number) {
    if (this.selectedCategoryIds.includes(categoryId)) {
      this.selectedCategoryIds = this.selectedCategoryIds.filter(id => id !== categoryId);
    } else {
      this.selectedCategoryIds.push(categoryId);
    }
    this.promotionForm.patchValue({ categoryIds: this.selectedCategoryIds });
  }

  removeCategory(categoryId: number) {
    this.selectedCategoryIds = this.selectedCategoryIds.filter(id => id !== categoryId);
    this.promotionForm.patchValue({ categoryIds: this.selectedCategoryIds });
  }

  loadPromotions() {
    const params: PromotionQueryParams = {
      page: this.currentPage,
      pageSize: this.itemsPerPage,
      sort: `${this.sortBy}:${this.sortOrder}`,
      search: this.searchTerm || undefined
    };

    this.promotionService.getAllPromotions(params).subscribe({
      next: (response) => {
        this.promotions = response.promotions;
        this.totalPromotions = response.total;
        this.totalPages = Math.ceil(response.total / this.itemsPerPage);
      },
      error: (err) => {
        this.toastService.showToast('Error al cargar las promociones', 'error');
      }
    });
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.loadPromotions();
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.loadPromotions();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.debounceSearch().subscribe(() => this.loadPromotions());
  }

  debounceSearch() {
    return of(this.searchTerm).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(() => of(null))
    );
  }

  sort(column: 'promotion_id' | 'start_date' | 'end_date' | 'discount_value' | 'created_at') {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = column;
      this.sortOrder = 'ASC';
    }
    this.loadPromotions();
  }

  openPromotionModal(mode: 'create' | 'edit', promotion?: Promotion) {
    if (mode === 'create') {
      this.selectedPromotionId = null;
      this.selectedVariantIds = [];
      this.selectedCategoryIds = [];
      this.variantSearchTerm = '';
      this.categorySearchTerm = '';
      this.promotionForm.reset({
        is_exclusive: true,
        min_quantity: null,
        min_order_count: null,
        min_unit_measure: null,
        variantIds: [],
        categoryIds: []
      });
      this.filterVariants('');
      this.filterCategories('');
      this.promotionModal.open();
    } else if (promotion) {
      this.selectedPromotionId = promotion.promotion_id;
      this.promotionService.getPromotionById(promotion.promotion_id).subscribe({
        next: (response) => {
          const promo = response.promotion;
          this.selectedVariantIds = (promo as any).variantIds?.map((v: any) => v.variant_id) || 
                                   promo.ProductVariants?.map(v => v.variant_id) || [];
          this.selectedCategoryIds = (promo as any).categoryIds?.map((c: any) => c.category_id) || 
                                    promo.Categories?.map(c => c.category_id) || [];
          this.variantSearchTerm = '';
          this.categorySearchTerm = '';
          this.promotionForm.patchValue({
            name: promo.name,
            promotion_type: promo.promotion_type,
            discount_value: promo.discount_value,
            min_quantity: promo.min_quantity,
            min_order_count: promo.min_order_count,
            min_unit_measure: promo.min_unit_measure,
            applies_to: promo.applies_to,
            is_exclusive: promo.is_exclusive,
            start_date: this.formatDateForInput(promo.start_date),
            end_date: this.formatDateForInput(promo.end_date),
            variantIds: this.selectedVariantIds,
            categoryIds: this.selectedCategoryIds
          });
          this.toggleFieldsBasedOnType(promo.promotion_type);
          this.filterVariants('');
          this.filterCategories('');
          this.promotionModal.open();
        },
        error: (err) => {
          this.toastService.showToast('Error al cargar los detalles de la promoción', 'error');
        }
      });
    }
  }

  savePromotion() {
    if (this.promotionForm.invalid || 
        (this.promotionForm.value.applies_to === 'specific_products' && this.selectedVariantIds.length === 0) ||
        (this.promotionForm.value.applies_to === 'specific_categories' && this.selectedCategoryIds.length === 0)) {
      this.promotionForm.markAllAsTouched();
      if (this.promotionForm.value.applies_to === 'specific_products' && this.selectedVariantIds.length === 0) {
        this.toastService.showToast('Debes seleccionar al menos un producto', 'error');
      } else if (this.promotionForm.value.applies_to === 'specific_categories' && this.selectedCategoryIds.length === 0) {
        this.toastService.showToast('Debes seleccionar al menos una categoría', 'error');
      }
      return;
    }

    const promotionData: PromotionData = {
      name: this.promotionForm.value.name,
      promotion_type: this.promotionForm.value.promotion_type,
      discount_value: this.promotionForm.value.discount_value,
      applies_to: this.promotionForm.value.applies_to,
      is_exclusive: this.promotionForm.value.is_exclusive,
      start_date: this.promotionForm.value.start_date,
      end_date: this.promotionForm.value.end_date,
    };

    if (this.promotionForm.value.promotion_type === 'quantity_discount') {
      promotionData.min_quantity = this.promotionForm.value.min_quantity;
    }
    if (this.promotionForm.value.promotion_type === 'order_count_discount') {
      promotionData.min_order_count = this.promotionForm.value.min_order_count;
    }
    if (this.promotionForm.value.promotion_type === 'unit_discount') {
      promotionData.min_unit_measure = this.promotionForm.value.min_unit_measure;
    }

    if (this.promotionForm.value.applies_to === 'specific_products') {
      promotionData.variantIds = this.selectedVariantIds;
    } else if (this.promotionForm.value.applies_to === 'specific_categories') {
      promotionData.categoryIds = this.selectedCategoryIds;
    }

    if (this.selectedPromotionId) {
      delete promotionData.status;
    }

    const serviceCall = this.selectedPromotionId
      ? this.promotionService.updatePromotion(this.selectedPromotionId, promotionData)
      : this.promotionService.createPromotion(promotionData);

    serviceCall.subscribe({
      next: (response) => {
        this.toastService.showToast(
          this.selectedPromotionId ? 'Promoción actualizada exitosamente' : 'Promoción creada exitosamente',
          'success'
        );
        this.loadPromotions();
        this.promotionModal.close();
        this.resetForm();
      },
      error: (err) => {
        this.toastService.showToast(err.message || 'Error al guardar la promoción', 'error');
      }
    });
  }

  resetForm() {
    this.selectedVariantIds = [];
    this.selectedCategoryIds = [];
    this.variantSearchTerm = '';
    this.categorySearchTerm = '';
    this.promotionForm.reset({
      is_exclusive: true,
      min_quantity: null,
      min_order_count: null,
      min_unit_measure: null,
      variantIds: [],
      categoryIds: []
    });
    this.toggleFieldsBasedOnType('');
    this.filterVariants('');
    this.filterCategories('');
  }

  deletePromotion(promotion: Promotion) {
    this.toastService.showToast(
      `¿Estás seguro de que deseas eliminar la promoción ${promotion.promotion_id}?`,
      'warning',
      'Confirmar',
      () => {
        this.promotionService.deletePromotion(promotion.promotion_id).subscribe({
          next: () => {
            this.toastService.showToast('Promoción eliminada exitosamente', 'success');
            this.loadPromotions();
          },
          error: (err) => {
            this.toastService.showToast(err.message || 'Error al eliminar la promoción', 'error');
          }
        });
      }
    );
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return 'Nunca';
    return this.datePipe.transform(date, "d 'de' MMMM 'de' yyyy", undefined, 'es') || 'Nunca';
  }

  formatDateTime(date: string | null | undefined): string {
    if (!date) return 'Nunca';
    return this.datePipe.transform(date, "d 'de' MMMM 'de' yyyy HH:mm", undefined, 'es') || 'Nunca';
  }

  formatDateForInput(date: string): string {
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  }
}