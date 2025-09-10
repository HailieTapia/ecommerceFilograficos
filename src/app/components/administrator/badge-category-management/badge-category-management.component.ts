import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { BadgeCategoryService, BadgeCategory } from '../../../services/badge-category.service';
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
export class BadgeCategoryManagementComponent implements OnInit, OnDestroy {
  @ViewChild('createEditModal') createEditModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

  badgeCategories: BadgeCategory[] = [];
  totalCategories = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searchTerm = '';
  statusFilter: 'active' | 'inactive' | 'all' = 'active';
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
    this.loadBadgeCategories();
  }

  ngAfterViewInit(): void {
    if (!this.createEditModal || !this.confirmModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadBadgeCategories(): void {
    this.isLoading = true; // Set loading to true
    this.subscriptions.add(
      this.badgeCategoryService.getAllBadgeCategories(this.currentPage, this.itemsPerPage, this.searchTerm, this.statusFilter).subscribe({
        next: (response) => {
          this.badgeCategories = response.badgeCategories;
          this.totalCategories = response.total;
          this.totalPages = Math.ceil(response.total / this.itemsPerPage);
          this.isLoading = false; // Set loading to false
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar las categorías de insignias';
          this.toastService.showToast(errorMessage, 'error');
          this.isLoading = false; // Set loading to false
        }
      })
    );
  }

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
    this.debounceSearch().subscribe(() => this.loadBadgeCategories());
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadBadgeCategories();
  }

  debounceSearch() {
    return of(this.searchTerm).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(() => of(null))
    );
  }

  // Validadores personalizados
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