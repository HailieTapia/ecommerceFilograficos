import { Component, OnInit, ViewChild, LOCALE_ID } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FaqCategoryService } from '../../services/faq-category.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { ModalComponent } from '../../../modal/modal.component';
import { ToastService } from '../../services/toastService';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
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
export class FaqCategoriesComponent implements OnInit {
  @ViewChild('faqCategoryModal') faqCategoryModal!: ModalComponent;

  categories: any[] = [];
  totalCategories = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searchTerm = '';
  categoryForm!: FormGroup;
  selectedCategoryId: string | null = null;

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

  loadCategories(): void {
    this.faqCategoryService.getAllCategories(this.currentPage, this.itemsPerPage, this.searchTerm).subscribe({
      next: (response) => {
        this.categories = response.faqCategories;
        this.totalCategories = response.total;
        this.totalPages = Math.ceil(response.total / this.itemsPerPage);
      },
      error: (err) => {
        this.toastService.showToast('Error al cargar las categorías', 'error');
      },
    });
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
  noSpecialCharsValidator(control: any) {
    const hasDangerousChars = /[<>'"`;]/.test(control.value);
    return hasDangerousChars ? { invalidContent: true } : null;
  }

  noNumbersValidator(control: any) {
    const hasNumbers = /\d/.test(control.value);
    return hasNumbers ? { invalidContent: true } : null;
  }

  noSQLInjectionValidator(control: any) {
    const sqlKeywords = /(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|EXEC|UNION|GRANT|REVOKE)/i;
    return sqlKeywords.test(control.value) ? { invalidContent: true } : null;
  }

  sanitizeInput(input: string): string {
    return input.replace(/[<>'"`;]/g, '').replace(/(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|EXEC|UNION|GRANT|REVOKE)/gi, '');
  }

  openCategoryModal(mode: 'create' | 'edit', category?: any): void {
    if (mode === 'create') {
      this.selectedCategoryId = null;
      this.categoryForm.reset();
      this.faqCategoryModal.open();
    } else if (category) {
      this.selectedCategoryId = category.category_id;
      this.faqCategoryService.getCategoryById(category.category_id).subscribe({
        next: (response) => {
          this.categoryForm.patchValue({
            name: response.faqCategory.name,
            description: response.faqCategory.description,
          });
          this.faqCategoryModal.open();
        },
        error: (err) => {
          this.toastService.showToast('Error al cargar los detalles de la categoría', 'error');
        },
      });
    }
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const categoryData = {
      name: this.sanitizeInput(this.categoryForm.value.name),
      description: this.sanitizeInput(this.categoryForm.value.description),
    };

    const serviceCall = this.selectedCategoryId
      ? this.faqCategoryService.updateCategory(this.selectedCategoryId, categoryData)
      : this.faqCategoryService.createCategory(categoryData);

    serviceCall.subscribe({
      next: (response) => {
        this.toastService.showToast(
          this.selectedCategoryId ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente',
          'success'
        );
        this.loadCategories();
        this.faqCategoryModal.close();
      },
      error: (err) => {
        this.toastService.showToast(err.message || 'Error al guardar la categoría', 'error');
      },
    });
  }

  deleteCategory(category: any): void {
    this.toastService.showToast(
      `¿Estás seguro de que deseas eliminar la categoría "${category.name}"? Esto eliminará todas las preguntas frecuentes asociadas.`,
      'warning',
      'Confirmar',
      () => {
        this.faqCategoryService.deleteCategory(category.category_id).subscribe({
          next: () => {
            this.toastService.showToast('Categoría eliminada exitosamente', 'success');
            this.loadCategories();
          },
          error: (err) => {
            this.toastService.showToast(err.message || 'Error al eliminar la categoría', 'error');
          },
        });
      }
    );
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, "d 'de' MMMM 'de' yyyy", undefined, 'es') || 'Fecha no disponible';
  }
}