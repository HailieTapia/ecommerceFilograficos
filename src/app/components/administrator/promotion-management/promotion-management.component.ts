import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PromotionService, Promotion, PromotionQueryParams, Variant, VariantQueryParams, PromotionData, ApplyPromotionRequest, ApplyPromotionResponse } from '../../../services/promotion.service';
import { CategorieService } from '../../../services/categorieService';
import { PaginationComponent } from '../pagination/pagination.component';
import { ModalComponent } from '../../reusable/modal/modal.component';
import { ToastService } from '../../../services/toastService';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
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
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
})
export class PromotionManagementComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('promotionModal') promotionModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

  promotions: Promotion[] = [];
  totalPromotions = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searchTerm = '';
  sortBy: 'promotion_id' | 'start_date' | 'end_date' | 'discount_value' | 'created_at' = 'promotion_id';
  sortOrder: 'ASC' | 'DESC' = 'ASC';
  statusFilter: 'current' | 'future' | 'expired' | 'all' = 'all';

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
  confirmAction: (() => void) | null = null;
  confirmModalTitle: string = '';
  confirmModalMessage: string = '';
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';
  applyCouponCode: string = '';
  associateCoupon: boolean = false;

  private subscriptions: Subscription = new Subscription();

  couponTypeLabels: { [key in 'percentage_discount' | 'fixed_discount' | 'free_shipping']: string } = {
    percentage_discount: 'Descuento Porcentual',
    fixed_discount: 'Descuento Fijo',
    free_shipping: 'Envío Gratis'
  };

  statusTypeLabels: { [key in 'current' | 'future' | 'expired']: string } = {
    current: 'Activa',
    future: 'Futura',
    expired: 'Expirada'
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
      coupon_type: ['', Validators.required],
      discount_value: ['', [Validators.required, Validators.min(0)]],
      max_uses: [null, Validators.min(1)],
      max_uses_per_user: [null, Validators.min(1)],
      min_order_value: [null, Validators.min(0)],
      free_shipping_enabled: [{ value: false, disabled: true }],
      applies_to: ['', Validators.required],
      is_exclusive: [true],
      start_date: ['', [Validators.required, this.dateNotBeforeToday.bind(this)]],
      end_date: ['', Validators.required],
      coupon_code: [{ value: '', disabled: true }, [Validators.minLength(3), Validators.maxLength(50)]],
      variantIds: [[]],
      categoryIds: [[]]
    }, {
      validators: this.dateRangeValidator
    });

    this.promotionForm.get('coupon_type')?.valueChanges.subscribe(type => {
      this.toggleFieldsBasedOnType(type);
    });

    this.promotionForm.get('applies_to')?.valueChanges.subscribe(appliesTo => {
      this.toggleSelection(appliesTo);
    });

    this.promotionForm.get('coupon_code')?.valueChanges.subscribe(value => {
      if (!this.associateCoupon) {
        this.promotionForm.patchValue({ coupon_code: '' });
      }
    });
  }

  ngOnInit() {
    this.loadPromotions();
    this.loadAvailableVariants();
    this.loadAvailableCategories();
    this.setupVariantSearch();
    this.setupCategorySearch();
  }

  ngAfterViewInit(): void {
    if (!this.promotionModal || !this.confirmModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
    this.subscriptions.add(
      this.promotionService.getAllVariants(params).subscribe({
        next: (response) => {
          this.availableVariants = response.variants;
          this.filteredVariants = [...this.availableVariants];
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar las variantes';
          this.toastService.showToast(errorMessage, 'error');
          this.availableVariants = [];
          this.filteredVariants = [];
        }
      })
    );
  }

  loadAvailableCategories() {
    this.subscriptions.add(
      this.categorieService.getCategories().subscribe({
        next: (response: any) => {
          this.availableCategories = response.map((cat: any) => ({
            category_id: cat.category_id,
            name: cat.name
          }));
          this.filteredCategories = [...this.availableCategories];
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar las categorías';
          this.toastService.showToast(errorMessage, 'error');
          this.availableCategories = [];
          this.filteredCategories = [];
        }
      })
    );
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
    this.subscriptions.add(
      of(this.variantSearchTerm).pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          this.filterVariants(term);
          return of(null);
        })
      ).subscribe()
    );
  }

  setupCategorySearch() {
    this.subscriptions.add(
      of(this.categorySearchTerm).pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          this.filterCategories(term);
          return of(null);
        })
      ).subscribe()
    );
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
    if (type === 'free_shipping') {
      controls['free_shipping_enabled'].enable();
      controls['discount_value'].disable();
      controls['discount_value'].setValue(0);
    } else {
      controls['free_shipping_enabled'].disable();
      controls['free_shipping_enabled'].setValue(false);
      controls['discount_value'].enable();
    }
  }

  toggleAssociateCoupon() {
    this.associateCoupon = !this.associateCoupon;
    const couponControl = this.promotionForm.get('coupon_code');
    if (this.associateCoupon) {
      couponControl?.enable();
    } else {
      couponControl?.disable();
      couponControl?.setValue('');
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
      search: this.searchTerm || undefined,
      statusFilter: this.statusFilter
    };

    this.subscriptions.add(
      this.promotionService.getAllPromotions(params).subscribe({
        next: (response) => {
          this.promotions = response.promotions;
          this.totalPromotions = response.total;
          this.totalPages = Math.ceil(response.total / this.itemsPerPage);
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar las promociones';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
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
    this.subscriptions.add(
      this.debounceSearch().subscribe(() => this.loadPromotions())
    );
  }

  onStatusFilterChange() {
    this.currentPage = 1;
    this.loadPromotions();
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
    if (!this.promotionModal) {
      this.toastService.showToast('Error: Modal de promoción no inicializado', 'error');
      return;
    }
    if (mode === 'create') {
      this.selectedPromotionId = null;
      this.selectedVariantIds = [];
      this.selectedCategoryIds = [];
      this.variantSearchTerm = '';
      this.categorySearchTerm = '';
      this.associateCoupon = false;
      this.promotionForm.reset({
        name: '',
        coupon_type: '',
        discount_value: '',
        max_uses: null,
        max_uses_per_user: null,
        min_order_value: null,
        free_shipping_enabled: false,
        applies_to: '',
        is_exclusive: true,
        start_date: '',
        end_date: '',
        coupon_code: '',
        variantIds: [],
        categoryIds: []
      });
      this.promotionForm.get('coupon_code')?.disable();
      this.promotionModal.title = 'Crear Nueva Promoción';
      this.promotionModal.modalType = 'success';
      this.promotionModal.isConfirmModal = false;
      this.filterVariants('');
      this.filterCategories('');
      this.promotionModal.open();
    } else if (promotion) {
      this.selectedPromotionId = promotion.promotion_id;
      this.subscriptions.add(
        this.promotionService.getPromotionById(promotion.promotion_id).subscribe({
          next: (response) => {
            const promo = response.promotion;
            this.selectedVariantIds = promo.ProductVariants?.map(v => v.variant_id) || [];
            this.selectedCategoryIds = promo.Categories?.map(c => c.category_id) || [];
            this.variantSearchTerm = '';
            this.categorySearchTerm = '';
            this.associateCoupon = !!promo.coupon_code;
            this.promotionForm.patchValue({
              name: promo.name,
              coupon_type: promo.coupon_type,
              discount_value: promo.discount_value,
              max_uses: promo.max_uses,
              max_uses_per_user: promo.max_uses_per_user,
              min_order_value: promo.min_order_value,
              free_shipping_enabled: promo.free_shipping_enabled,
              applies_to: promo.applies_to,
              is_exclusive: promo.is_exclusive,
              start_date: this.formatDateForInput(promo.start_date),
              end_date: this.formatDateForInput(promo.end_date),
              coupon_code: promo.coupon_code || '',
              variantIds: this.selectedVariantIds,
              categoryIds: this.selectedCategoryIds
            });
            this.toggleFieldsBasedOnType(promo.coupon_type);
            if (this.associateCoupon) {
              this.promotionForm.get('coupon_code')?.enable();
            } else {
              this.promotionForm.get('coupon_code')?.disable();
            }
            this.filterVariants('');
            this.filterCategories('');
            this.promotionModal.title = 'Editar Promoción';
            this.promotionModal.modalType = 'info';
            this.promotionModal.isConfirmModal = false;
            this.promotionModal.open();
          },
          error: (err) => {
            const errorMessage = err?.error?.message || 'Error al cargar los detalles de la promoción';
            this.toastService.showToast(errorMessage, 'error');
          }
        })
      );
    }
  }

  savePromotion() {
    if (
      this.promotionForm.invalid ||
      (this.promotionForm.value.applies_to === 'specific_products' && this.selectedVariantIds.length === 0) ||
      (this.promotionForm.value.applies_to === 'specific_categories' && this.selectedCategoryIds.length === 0)
    ) {
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
      coupon_type: this.promotionForm.value.coupon_type,
      discount_value: parseFloat(this.promotionForm.value.discount_value) || 0,
      max_uses: this.promotionForm.value.max_uses ? parseInt(this.promotionForm.value.max_uses) : null,
      max_uses_per_user: this.promotionForm.value.max_uses_per_user ? parseInt(this.promotionForm.value.max_uses_per_user) : null,
      min_order_value: this.promotionForm.value.min_order_value ? parseFloat(this.promotionForm.value.min_order_value) : null,
      free_shipping_enabled: this.promotionForm.value.coupon_type === 'free_shipping' ? this.promotionForm.value.free_shipping_enabled : false,
      applies_to: this.promotionForm.value.applies_to,
      is_exclusive: this.promotionForm.value.is_exclusive,
      start_date: new Date(this.promotionForm.value.start_date).toISOString(),
      end_date: new Date(this.promotionForm.value.end_date).toISOString(),
      coupon_code: this.associateCoupon ? this.promotionForm.value.coupon_code || null : null,
      variantIds: this.promotionForm.value.applies_to === 'specific_products' ? this.selectedVariantIds : [],
      categoryIds: this.promotionForm.value.applies_to === 'specific_categories' ? this.selectedCategoryIds : []
    };

    this.subscriptions.add(
      (this.selectedPromotionId
        ? this.promotionService.updatePromotion(this.selectedPromotionId, promotionData)
        : this.promotionService.createPromotion(promotionData)
      ).subscribe({
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
          const errorMessage = err?.error?.message || 'Error al guardar la promoción';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  applyPromotionToCart(promotionId: number | null, couponCode: string) {
    if (!promotionId && !couponCode) {
      this.toastService.showToast('Debe proporcionar un ID de promoción o un código de cupón', 'error');
      return;
    }

    const request: ApplyPromotionRequest = {
      promotion_id: promotionId || undefined,
      coupon_code: couponCode || undefined
    };

    this.subscriptions.add(
      this.promotionService.applyPromotion(request).subscribe({
        next: (response: ApplyPromotionResponse) => {
          const message = response.promotion.promotion_progress.is_eligible
            ? `Promoción "${response.promotion.name}" aplicada al carrito: ${response.cart.coupon_code || 'Sin código'}. Descuento: $${response.cart.total_discount}`
            : response.promotion.promotion_progress.message;
          const toastType = response.promotion.promotion_progress.is_eligible ? 'success' : 'warning';
          this.toastService.showToast(message, toastType);
          this.applyCouponCode = '';
          if (response.promotion.promotion_progress.is_eligible) {
            this.loadPromotions();
          }
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al aplicar la promoción';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  openConfirmModal(title: string, message: string, modalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default', action: () => void) {
    if (!this.confirmModal) {
      this.toastService.showToast('Error: Modal de confirmación no inicializado', 'error');
      return;
    }
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmModalType = modalType;
    this.confirmAction = action;
    this.confirmModal.title = title;
    this.confirmModal.modalType = modalType;
    this.confirmModal.isConfirmModal = true;
    this.confirmModal.confirmText = 'Confirmar';
    this.confirmModal.cancelText = 'Cancelar';
    this.confirmModal.open();
  }

  handleConfirm(): void {
    if (this.confirmAction) {
      this.confirmAction();
      this.confirmAction = null;
    }
  }

  deletePromotion(promotion: Promotion) {
    this.openConfirmModal(
      'Eliminar Promoción',
      `¿Estás seguro de que deseas eliminar la promoción "${promotion.name}"?`,
      'danger',
      () => {
        this.subscriptions.add(
          this.promotionService.deletePromotion(promotion.promotion_id).subscribe({
            next: () => {
              this.toastService.showToast('Promoción eliminada exitosamente', 'success');
              this.loadPromotions();
              if (this.confirmModal) this.confirmModal.close();
            },
            error: (err) => {
              const errorMessage = err?.error?.message || 'Error al eliminar la promoción';
              this.toastService.showToast(errorMessage, 'error');
              if (this.confirmModal) this.confirmModal.close();
            }
          })
        );
      }
    );
  }

  resetForm() {
    this.selectedVariantIds = [];
    this.selectedCategoryIds = [];
    this.variantSearchTerm = '';
    this.categorySearchTerm = '';
    this.associateCoupon = false;
    this.promotionForm.reset({
      name: '',
      coupon_type: '',
      discount_value: '',
      max_uses: null,
      max_uses_per_user: null,
      min_order_value: null,
      free_shipping_enabled: false,
      applies_to: '',
      is_exclusive: true,
      start_date: '',
      end_date: '',
      coupon_code: '',
      variantIds: [],
      categoryIds: []
    });
    this.promotionForm.get('coupon_code')?.disable();
    this.promotionForm.get('free_shipping_enabled')?.disable();
    this.filterVariants('');
    this.filterCategories('');
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