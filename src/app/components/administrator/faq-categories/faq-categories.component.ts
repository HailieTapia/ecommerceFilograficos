import { Component, OnInit, ViewChild, OnDestroy, LOCALE_ID } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { FaqCategoryService } from '../../../services/faq-category.service';
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
  selector: 'app-faq-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
    ModalComponent,
    DatePipe
  ],
  templateUrl: './faq-categories.component.html',
  styleUrls: ['./faq-categories.component.css'],
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
})
export class FaqCategoriesComponent implements OnInit, OnDestroy {
  @ViewChild('createEditModal') createEditModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

  categories: any[] = [];
  totalCategories = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searchTerm = '';
  categoryForm!: FormGroup;
  selectedCategoryId: string | null = null;
  private subscriptions: Subscription = new Subscription();
  confirmAction: (() => void) | null = null;
  confirmModalTitle: string = '';
  confirmModalMessage: string = '';
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';

  constructor(
    private faqCategoryService: FaqCategoryService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(500),
        this.noNumbersValidator,
        this.noSpecialCharsValidator,
        this.noSQLInjectionValidator,
      ]],
      description: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(500),
        this.noNumbersValidator,
        this.noSpecialCharsValidator,
        this.noSQLInjectionValidator,
      ]],
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    if (!this.createEditModal || !this.confirmModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadCategories(): void {
    this.subscriptions.add(
      this.faqCategoryService.getAllCategories(this.currentPage, this.itemsPerPage, this.searchTerm).subscribe({
        next: (response) => {
          this.categories = response.faqCategories;
          this.totalCategories = response.total;
          this.totalPages = Math.ceil(response.total / this.itemsPerPage);
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar las categorías';
          this.toastService.showToast(errorMessage, 'error');
        },
      })
    );
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadCategories();
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadCategories();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.debounceSearch().subscribe(() => this.loadCategories());
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

  noNumbersValidator(control: AbstractControl) {
    const hasNumbers = /\d/.test(control.value);
    return hasNumbers ? { invalidContent: true } : null;
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
    this.createEditModal.title = 'Crear Categoría';
    this.createEditModal.open();
  }

  openEditModal(category: any): void {
    if (!this.createEditModal) {
      this.toastService.showToast('Error: Modal de edición no inicializado', 'error');
      return;
    }
    this.selectedCategoryId = category.category_id;
    this.subscriptions.add(
      this.faqCategoryService.getCategoryById(category.category_id).subscribe({
        next: (response) => {
          this.categoryForm.patchValue({
            name: response.faqCategory.name,
            description: response.faqCategory.description,
          });
          this.createEditModal.modalType = 'info';
          this.createEditModal.title = 'Editar Categoría';
          this.createEditModal.open();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar los detalles de la categoría';
          this.toastService.showToast(errorMessage, 'error');
        },
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
      description: this.sanitizeInput(this.categoryForm.value.description),
    };

    const serviceCall = this.selectedCategoryId
      ? this.faqCategoryService.updateCategory(this.selectedCategoryId, categoryData)
      : this.faqCategoryService.createCategory(categoryData);

    this.subscriptions.add(
      serviceCall.subscribe({
        next: () => {
          this.toastService.showToast(
            this.selectedCategoryId ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente',
            'success'
          );
          this.loadCategories();
          if (this.createEditModal) this.createEditModal.close();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al guardar la categoría';
          this.toastService.showToast(errorMessage, 'error');
        },
      })
    );
  }

  deleteCategory(category: any): void {
    this.openConfirmModal(
      'Eliminar Categoría',
      `¿Estás seguro de que deseas eliminar la categoría "${category.name}"? Esto eliminará todas las preguntas frecuentes asociadas.`,
      'danger',
      () => {
        this.subscriptions.add(
          this.faqCategoryService.deleteCategory(category.category_id).subscribe({
            next: () => {
              this.toastService.showToast('Categoría eliminada exitosamente', 'success');
              this.loadCategories();
              if (this.confirmModal) this.confirmModal.close();
            },
            error: (err) => {
              const errorMessage = err?.error?.message || 'Error al eliminar la categoría';
              this.toastService.showToast(errorMessage, 'error');
              if (this.confirmModal) this.confirmModal.close();
            },
          })
        );
      }
    );
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, "d 'de' MMMM 'de' yyyy", undefined, 'es') || 'Fecha no disponible';
  }
}