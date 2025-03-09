import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CategorieService } from '../../services/categorieService';
import { ModalComponent } from '../../../modal/modal.component';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../pagination/pagination.component';
import { ToastService } from '../../services/toastService';
@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, PaginationComponent, CommonModule, ModalComponent, ReactiveFormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit, AfterViewInit {
  @ViewChild('modal') modal!: ModalComponent;
  categories: any[] = [];
  total: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  categoryForm!: FormGroup;
  selectedCategoryId: number | null = null;

  // Nuevas propiedades para los filtros y ordenamiento
  filterActive: boolean | undefined = undefined; // undefined = todas, true = activas, false = desactivadas
  filterName: string = ''; // Filtro por nombre
  sortBy: string = 'name'; // Campo por defecto para ordenar
  sortOrder: 'ASC' | 'DESC' = 'ASC'; // Dirección por defecto del ordenamiento

  constructor(
    private toastService: ToastService,
    private categoriesService: CategorieService,
    private fb: FormBuilder,
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.getAllCategories();
  }

  ngAfterViewInit(): void {
    if (!this.modal) {
      this.toastService.showToast('El modal no está inicializado correctamente.', 'info');
    }
  }

  // Método ajustado para traer categorías con filtros y ordenamiento
  getAllCategories(): void {
    this.categoriesService
      .getAllCategories(
        this.currentPage,
        this.itemsPerPage,
        this.filterActive, // Filtro por estado
        this.filterName,   // Filtro por nombre
        this.sortBy,       // Campo de ordenamiento
        this.sortOrder     // Dirección del ordenamiento
      )
      .subscribe({
        next: (data) => {
          this.categories = data.categories;
          this.total = data.total;
          this.currentPage = data.page;
          this.itemsPerPage = data.pageSize;
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al obtener categorías';
          this.toastService.showToast(errorMessage, 'error');
        }
      });
  }

  // Maneja el cambio de página desde PaginationComponent
  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.getAllCategories();
  }

  // Métodos existentes sin cambios
  openCreateModal(): void {
    this.selectedCategoryId = null;
    this.categoryForm.reset();
    this.modal.open();
  }

  openEditModal(categoryId: number): void {
    this.selectedCategoryId = categoryId;
    this.categoriesService.getCategoryById(categoryId).subscribe({
      next: (category) => {
        if (category && category.active === true) {
          this.categoryForm.patchValue(category);
          this.modal.open();
        } else {
          alert('La categoría no está disponible para edición.');
        }
      },
      error: (err) => {
        console.error('Error al obtener la categoría:', err);
      }
    });
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      alert('Formulario inválido. Revisa los campos.');
      return;
    }
    const categoryData = this.categoryForm.value;
    if (this.selectedCategoryId) {
      this.categoriesService.updateCategory(this.selectedCategoryId, categoryData).subscribe({
        next: () => {
          alert('Categoría actualizada exitosamente');
          this.getAllCategories();
          this.modal.close();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al actualizar la categoría';
          this.toastService.showToast(errorMessage, 'error');
        }
      });
    } else {
      this.categoriesService.createCategory(categoryData).subscribe({
        next: () => {
          alert('Categoría creada exitosamente');
          this.getAllCategories();
          this.modal.close();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al crear categoría';
          this.toastService.showToast(errorMessage, 'error');
        }
      });
    }
  }

  deleteCategory(categoryId: number): void {
    this.toastService.showToast(
      '¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.',
      'warning',
      'Confirmar',
      () => {
        this.categoriesService.deleteCategory(categoryId).subscribe({
          next: (response) => {
            this.toastService.showToast(response.message || 'Categoría eliminada exitosamente', 'success');
            this.getAllCategories();
          },
          error: (error) => {
            const errorMessage = error?.error?.message || 'Error al eliminar la categoría';
            this.toastService.showToast(errorMessage, 'error');
          }
        });
      }
    );
  }
  // Método para manejar el cambio en el filtro por nombre
  onNameFilterChange(name: string): void {
    this.filterName = name;
    this.currentPage = 1;
    this.getAllCategories();
  }

  // Método para manejar el cambio en el filtro de estado
  onActiveFilterChange(active: boolean | undefined): void {
    this.filterActive = active;
    this.currentPage = 1;
    this.getAllCategories();
  }

  // Método para alternar el ordenamiento
  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    this.getAllCategories();
  }
}