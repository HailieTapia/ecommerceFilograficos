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
import { ClusterService, ClusterGroup } from '../../../services/cluster.service';
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

  clusters: ClusterGroup[] = [];
  applyUserSegmentation: boolean = false;

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
    private datePipe: DatePipe,
    private clusterService: ClusterService
  ) {
    this.minStartDate = new Date().toISOString().slice(0, 16);

    this.promotionForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      coupon_type: ['', Validators.required],
      discount_value: ['', [Validators.required, Validators.min(0)]],
      max_uses: [null],
      max_uses_per_user: [null],
      min_order_value: [null],
      free_shipping_enabled: [{ value: false, disabled: true }],
      applies_to: ['', Validators.required],
      is_exclusive: [true],
      start_date: ['', [Validators.required, this.dateNotBeforeToday.bind(this)]],
      end_date: ['', Validators.required],
      coupon_code: [{ value: '', disabled: true }, [Validators.minLength(3), Validators.maxLength(50)]],
      variantIds: [[]],
      categoryIds: [[]],
      cluster_id: [null]
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
    this.loadClusters();
    this.loadPromotions();
    this.loadAvailableVariants();
    this.loadAvailableCategories();
    this.setupVariantSearch();
    this.setupCategorySearch();
  }
  loadClusters(): void {
    this.clusterService.getAllClientClusters().subscribe({
      next: (res: ClusterGroup[]) => {
        this.clusters = res;
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al cargar los clústeres';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }
  toggleUserSegmentation() {
    if (this.applyUserSegmentation) {
      this.promotionForm.get('cluster_id')?.setValidators([Validators.required]);
    } else {
      this.promotionForm.get('cluster_id')?.setValue(null);
      this.promotionForm.get('cluster_id')?.clearValidators();
    }
    this.promotionForm.get('cluster_id')?.updateValueAndValidity();
  }
  toggleFieldsBasedOnType(type: string) {
    const controls = this.promotionForm.controls;
    if (type === 'free_shipping') {
      controls['free_shipping_enabled'].enable();
      controls['discount_value'].disable();
      controls['discount_value'].setValue(null);
      controls['discount_value'].clearValidators();
    } else {
      controls['free_shipping_enabled'].disable();
      controls['free_shipping_enabled'].setValue(false);
      controls['discount_value'].enable();
      controls['discount_value'].setValidators([Validators.required, Validators.min(0)]);
    }
    controls['discount_value'].updateValueAndValidity();
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
      this.applyUserSegmentation = false;
      this.promotionForm.reset({
        name: '',
        coupon_type: '',
        discount_value: null,
        max_uses: null,
        max_uses_per_user: null,
        min_order_value: null,
        free_shipping_enabled: false,
        applies_to: '',
        is_exclusive: true,
        start_date: '',
        end_date: '',
        coupon_code: null,
        variantIds: [],
        categoryIds: [],
        cluster_id: null
      });
      this.promotionForm.get('coupon_code')?.disable();
      this.promotionForm.get('free_shipping_enabled')?.disable();
      this.promotionForm.get('cluster_id')?.clearValidators();
      this.promotionForm.get('cluster_id')?.updateValueAndValidity();
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
            this.selectedVariantIds = (promo.variantIds as any[])?.map((v: { variant_id: number }) => v.variant_id) || [];
            this.selectedCategoryIds = promo.categoryIds || [];
            this.associateCoupon = !!promo.coupon_code;
            this.applyUserSegmentation = !!promo.cluster_id; // Activamos Toggle si hay cluster_id

            const missingVariants = this.selectedVariantIds.filter(
              id => !this.availableVariants.some(v => v.variant_id === id)
            );

            if (missingVariants.length > 0) {
              this.subscriptions.add(
                this.promotionService.getAllVariants({ search: missingVariants.join(',') }).subscribe({
                  next: (response) => {
                    this.availableVariants = [...this.availableVariants, ...response.variants];
                    this.filterVariants(this.variantSearchTerm);
                  },
                  error: (err) => {
                    this.toastService.showToast('Error al cargar variantes adicionales', 'error');
                  }
                })
              );
            }

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
              coupon_code: promo.coupon_code || null,
              variantIds: this.selectedVariantIds,
              categoryIds: this.selectedCategoryIds,
              cluster_id: promo.cluster_id || null
            });

            if (this.applyUserSegmentation) {
              this.promotionForm.get('cluster_id')?.setValidators([Validators.required]);
            } else {
              this.promotionForm.get('cluster_id')?.clearValidators();
            }
            this.promotionForm.get('cluster_id')?.updateValueAndValidity();

            if (this.associateCoupon) {
              this.promotionForm.get('coupon_code')?.enable();
            } else {
              this.promotionForm.get('coupon_code')?.disable();
            }
            this.toggleFieldsBasedOnType(promo.coupon_type);
            this.filterVariants(this.variantSearchTerm);
            this.filterCategories(this.categorySearchTerm);

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

  resetForm() {
    this.selectedVariantIds = [];
    this.selectedCategoryIds = [];
    this.variantSearchTerm = '';
    this.categorySearchTerm = '';
    this.associateCoupon = false;
    this.applyUserSegmentation = false;
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
      categoryIds: [],
      cluster_id: null
    });
    this.promotionForm.get('coupon_code')?.disable();
    this.promotionForm.get('free_shipping_enabled')?.disable();
    this.promotionForm.get('cluster_id')?.clearValidators();
    this.promotionForm.get('cluster_id')?.updateValueAndValidity();
    this.filterVariants('');
    this.filterCategories('');
  }

  savePromotion() {
    if (this.promotionForm.invalid) {
      this.promotionForm.markAllAsTouched();
      this.toastService.showToast('Por favor, completa todos los campos obligatorios.', 'error');
      return;
    }

    const appliesTo = this.promotionForm.value.applies_to;
    if (appliesTo === 'specific_products' && this.selectedVariantIds.length === 0) {
      this.toastService.showToast('Debes seleccionar al menos un producto.', 'error');
      return;
    }
    if (appliesTo === 'specific_categories' && this.selectedCategoryIds.length === 0) {
      this.toastService.showToast('Debes seleccionar al menos una categoría.', 'error');
      return;
    }
    if (this.applyUserSegmentation && !this.promotionForm.value.cluster_id) {
      this.promotionForm.get('cluster_id')?.markAsTouched();
      this.toastService.showToast('Debes seleccionar un clúster.', 'error');
      return;
    }

    const promotionData: PromotionData = {
      name: this.promotionForm.value.name,
      coupon_type: this.promotionForm.value.coupon_type,
      discount_value: parseFloat(this.promotionForm.value.discount_value) || 0,
      free_shipping_enabled: this.promotionForm.value.coupon_type === 'free_shipping' ? this.promotionForm.value.free_shipping_enabled : false,
      applies_to: this.applyUserSegmentation ? 'cluster' : this.promotionForm.value.applies_to, // Temporal para compatibilidad
      is_exclusive: this.promotionForm.value.is_exclusive,
      start_date: new Date(this.promotionForm.value.start_date).toISOString(),
      end_date: new Date(this.promotionForm.value.end_date).toISOString(),
      variantIds: appliesTo === 'specific_products' ? this.selectedVariantIds : [],
      categoryIds: appliesTo === 'specific_categories' ? this.selectedCategoryIds : [],
      cluster_id: this.applyUserSegmentation ? parseInt(this.promotionForm.value.cluster_id, 10) : undefined
    };

    if (this.promotionForm.value.max_uses) {
      promotionData.max_uses = parseInt(this.promotionForm.value.max_uses, 10);
    }
    if (this.promotionForm.value.max_uses_per_user) {
      promotionData.max_uses_per_user = parseInt(this.promotionForm.value.max_uses_per_user, 10);
    }
    if (this.promotionForm.value.min_order_value) {
      promotionData.min_order_value = parseFloat(this.promotionForm.value.min_order_value);
    }
    if (this.associateCoupon && this.promotionForm.value.coupon_code) {
      promotionData.coupon_code = this.promotionForm.value.coupon_code;
    }

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




  //aqui no mover
  ngAfterViewInit(): void {
    if (!this.promotionModal || !this.confirmModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
  sort(column: 'promotion_id' | 'start_date' | 'end_date' | 'discount_value' | 'created_at') {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = column;
      this.sortOrder = 'ASC';
    }
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
  removeCategory(categoryId: number) {
    this.selectedCategoryIds = this.selectedCategoryIds.filter(id => id !== categoryId);
    this.promotionForm.patchValue({ categoryIds: this.selectedCategoryIds });
  }
  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.loadPromotions();
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.loadPromotions();
  }
  getVariantImage(variantId: number): string {
    const variant = this.availableVariants.find(v => v.variant_id === variantId);
    return variant?.image_url || 'assets/default-image.jpg';
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
      this.filteredVariants = [
        ...this.availableVariants.filter(variant =>
          this.selectedVariantIds.includes(variant.variant_id) ||
          variant.product_name.toLowerCase().includes(lowerTerm) ||
          variant.sku.toLowerCase().includes(lowerTerm)
        )
      ];
      this.filteredVariants = Array.from(new Set(this.filteredVariants.map(v => v.variant_id)))
        .map(id => this.availableVariants.find(v => v.variant_id === id)!)
        .filter(v => v !== undefined);
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
    if (appliesTo !== 'cluster') {
      this.promotionForm.patchValue({ cluster_id: '' });
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

  getVariantName(variantId: number): string {
    const variant = this.availableVariants.find(v => v.variant_id === variantId);
    return variant ? variant.product_name : `Variante ${variantId} (No disponible)`;
  }
}




