import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { BadgeCategoryService, BadgeCategory, BadgeDistributionReportItem } from '../../../services/badge-category.service'; // Importar BadgeDistributionReportItem
import { PaginationComponent } from '../pagination/pagination.component';
import { ModalComponent } from '../../reusable/modal/modal.component';
import { ToastService } from '../../../services/toastService';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

// Registrar los datos de localización para español
registerLocaleData(localeEs);

@Component({
  selector: 'app-badge-category-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
    ModalComponent,
    DatePipe
  ],
  templateUrl: './badge-category-management.component.html',
  styleUrls: ['./badge-category-management.component.css'],
  providers: [
    DatePipe,
    { provide: 'LOCALE_ID', useValue: 'es' }
  ]
})
export class BadgeCategoryManagementComponent implements OnInit, AfterViewInit, OnDestroy { // Añadido AfterViewInit
  @ViewChild('createEditModal') createEditModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;
  @ViewChild('reportModal') reportModal!: ModalComponent; // NUEVO: Modal para reportes

  badgeCategories: BadgeCategory[] = [];
  totalCategories = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searchTerm = '';
  statusFilter: 'active' | 'inactive' | 'all' = 'active';

  // --- NUEVAS PROPIEDADES DE FILTRO Y REPORTE ---
  badgeNameFilter = ''; // Filtro por nombre de insignia
  sortColumn = 'badge_category_id'; // Columna para ordenar
  sortDirection: 'ASC' | 'DESC' = 'ASC'; // Dirección de ordenamiento
  badgeDistributionReport: BadgeDistributionReportItem[] = [];
  isReportLoading: boolean = false;
  // ---------------------------------------------

  categoryForm!: FormGroup;
  selectedCategoryId: string | null = null;
  private subscriptions: Subscription = new Subscription();
  confirmAction: (() => void) | null = null;
  confirmModalTitle: string = '';
  confirmModalMessage: string = '';
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';
  isLoading: boolean = false;

  constructor(
    private badgeCategoryService: BadgeCategoryService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        this.noSpecialCharsValidator,
        this.noSQLInjectionValidator
      ]],
      description: ['', [
        Validators.maxLength(500),
        this.noSpecialCharsValidator,
        this.noSQLInjectionValidator
      ]]
    });
  }

  ngOnInit(): void {
    // Inicializar la carga con un debounce para el término de búsqueda principal
    this.debounceSearch().subscribe(() => this.loadBadgeCategories());
  }

  ngAfterViewInit(): void {
    if (!this.createEditModal || !this.confirmModal || !this.reportModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // --- LÓGICA PRINCIPAL DE CONSULTA (ACTUALIZADA) ---
  loadBadgeCategories(): void {
    this.isLoading = true; 
    const sort = `${this.sortColumn}:${this.sortDirection}`;

    this.subscriptions.add(
      this.badgeCategoryService.getAllBadgeCategories(
        this.currentPage, 
        this.itemsPerPage, 
        this.searchTerm, 
        this.statusFilter,
        sort, // NUEVO: Ordenamiento
        this.badgeNameFilter // NUEVO: Filtro por insignia
      ).subscribe({
        next: (response) => {
          this.badgeCategories = response.badgeCategories;
          this.totalCategories = response.total;
          this.totalPages = Math.ceil(response.total / this.itemsPerPage);
          this.isLoading = false; 
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar las categorías de insignias';
          this.toastService.showToast(errorMessage, 'error');
          this.isLoading = false; 
        }
      })
    );
  }

  // --- MANEJADORES DE CAMBIO ---
  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadBadgeCategories();
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadBadgeCategories();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    // La suscripción se hace en ngOnInit, aquí solo emitimos el valor
    of(this.searchTerm).pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => this.loadBadgeCategories());
  }
  
  onBadgeNameFilterChange(): void {
    this.currentPage = 1;
    this.debounceSearch().subscribe(() => this.loadBadgeCategories());
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadBadgeCategories();
  }
  
  // --- LÓGICA DE ORDENAMIENTO (NUEVA) ---
  onSortChange(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'ASC';
    }
    this.loadBadgeCategories();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'fas fa-sort text-gray-400';
    }
    return this.sortDirection === 'ASC' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  debounceSearch() {
    return of(this.searchTerm).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(() => of(null))
    );
  }

  // --- LÓGICA DE REPORTES (NUEVA) ---
  openReportModal(): void {
    if (!this.reportModal) {
      this.toastService.showToast('Error: Modal de reportes no inicializado', 'error');
      return;
    }
    this.badgeDistributionReport = [];
    this.isReportLoading = true;
    this.reportModal.title = 'Reporte de Distribución de Insignias';
    this.reportModal.modalType = 'info';
    this.reportModal.isConfirmModal = false;
    this.reportModal.open();

    this.subscriptions.add(
        this.badgeCategoryService.getBadgeDistributionReport().subscribe({
            next: (response) => {
                this.badgeDistributionReport = response.report;
                this.isReportLoading = false;
            },
            error: (err) => {
                const errorMessage = err?.error?.message || 'Error al generar el reporte de distribución';
                this.toastService.showToast(errorMessage, 'error');
                this.isReportLoading = false;
                this.reportModal.close();
            }
        })
    );
  }
  // ---------------------------------

  // Validadores y lógica CRUD (Se mantienen sin cambios)
  noSpecialCharsValidator(control: AbstractControl) {
    const hasDangerousChars = /[<>'"`;]/.test(control.value);
    return hasDangerousChars ? { invalidContent: true } : null;
  }

  noSQLInjectionValidator(control: AbstractControl) {
    const sqlKeywords = /(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|EXEC|UNION|GRANT|REVOKE)/i;
    return sqlKeywords.test(control.value) ? { invalidContent: true } : null;
  }

  sanitizeInput(input: string): string {
    return input.replace(/[<>'"`;]/g, '').replace(/(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|EXEC|UNION|GRANT|REVOKE)/gi, '');
  }

  openCreateModal(): void {
    if (!this.createEditModal) {
      this.toastService.showToast('Error: Modal de creación no inicializado', 'error');
      return;
    }
    this.selectedCategoryId = null;
    this.categoryForm.reset();
    this.createEditModal.modalType = 'success';
    this.createEditModal.title = 'Crear Categoría de Insignias';
    this.createEditModal.open();
  }

  openEditModal(category: BadgeCategory): void {
    if (!this.createEditModal) {
      this.toastService.showToast('Error: Modal de edición no inicializado', 'error');
      return;
    }
    this.selectedCategoryId = category.badge_category_id.toString();
    this.subscriptions.add(
      this.badgeCategoryService.getBadgeCategoryById(category.badge_category_id.toString()).subscribe({
        next: (response) => {
          this.categoryForm.patchValue({
            name: response.badgeCategory.name,
            description: response.badgeCategory.description
          });
          this.createEditModal.modalType = 'info';
          this.createEditModal.title = 'Editar Categoría de Insignias';
          this.createEditModal.open();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar los detalles de la categoría';
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

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      this.toastService.showToast('Formulario inválido. Revisa los campos.', 'error');
      return;
    }

    const categoryData = {
      name: this.sanitizeInput(this.categoryForm.value.name),
      description: this.sanitizeInput(this.categoryForm.value.description || '')
    };

    const serviceCall = this.selectedCategoryId
      ? this.badgeCategoryService.updateBadgeCategory(this.selectedCategoryId, categoryData)
      : this.badgeCategoryService.createBadgeCategory(categoryData);

    this.subscriptions.add(
      serviceCall.subscribe({
        next: () => {
          this.toastService.showToast(
            this.selectedCategoryId ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente',
            'success'
          );
          this.loadBadgeCategories();
          if (this.createEditModal) this.createEditModal.close();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al guardar la categoría';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  deleteCategory(category: BadgeCategory): void {
    this.openConfirmModal(
      'Eliminar Categoría de Insignias',
      `¿Estás seguro de que deseas eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`,
      'danger',
      () => {
        this.subscriptions.add(
          this.badgeCategoryService.deleteBadgeCategory(category.badge_category_id.toString()).subscribe({
            next: () => {
              this.toastService.showToast('Categoría eliminada exitosamente', 'success');
              this.loadBadgeCategories();
              if (this.confirmModal) this.confirmModal.close();
            },
            error: (err) => {
              const errorMessage = err?.error?.message || 'Error al eliminar la categoría';
              this.toastService.showToast(errorMessage, 'error');
              if (this.confirmModal) this.confirmModal.close();
            }
          })
        );
      }
    );
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, "d 'de' MMMM 'de' yyyy", undefined, 'es') || 'Fecha no disponible';
  }
}