import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategorieService } from '../../services/categorieService';
import { ModalComponent } from '../../../modal/modal.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ModalComponent, ReactiveFormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit, AfterViewInit {
  @ViewChild('modal') modal!: ModalComponent;
  categories: any[] = [];
  total: number = 0; // Total de categorías
  page: number = 1; // Página actual
  pageSize: number = 10; // Tamaño de página
  categoryForm!: FormGroup;
  selectedCategoryId: number | null = null;

  constructor(private categoriesService: CategorieService, private fb: FormBuilder) {
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
      console.error("El modal no está inicializado correctamente.");
    }
  }

  getAllCategories(): void {
    this.categoriesService.getAllCategories(this.page, this.pageSize).subscribe({
      next: (data) => {
        this.categories = data.categories; // Ajustado para la nueva estructura
        this.total = data.total;
        this.page = data.page;
        this.pageSize = data.pageSize;
      },
      error: (err) => {
        console.error('Error al obtener categorías:', err);
      }
    });
  }

  // Métodos de navegación para paginación
  nextPage(): void {
    if (this.page * this.pageSize < this.total) {
      this.page++;
      this.getAllCategories();
    }
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.getAllCategories();
    }
  }

  totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
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
          console.error('Error al actualizar la categoría:', err);
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
          console.error('Error al crear categoría:', err);
        }
      });
    }
  }

  deleteCategory(categoryId: number): void {
    if (!confirm('¿Estás seguro de que deseas desactivar esta categoría?')) return;

    this.categoriesService.deleteCategory(categoryId).subscribe({
      next: () => {
        alert('Categoría desactivada exitosamente');
        this.getAllCategories();
      },
      error: (err) => {
        console.error('Error al desactivar la categoría:', err);
      }
    });
  }
}