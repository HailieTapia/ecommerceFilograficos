import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategorieService } from '../../services/categorieService';
import { ModalComponent } from '../../../modal/modal.component';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../pagination/pagination.component';
@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [PaginationComponent, CommonModule, ModalComponent, ReactiveFormsModule],
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
  //traer por paginacion 
  getAllCategories(): void {
    this.categoriesService.getAllCategories(this.currentPage, this.itemsPerPage).subscribe({
      next: (data) => {
        this.categories = data.categories;
        this.total = data.total;
        this.currentPage = data.page;
        this.itemsPerPage = data.pageSize;
      },
      error: (err) => {
        console.error('Error al obtener categorías:', err);
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
  //abrir modal
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
  //envir guardado-actualizar
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
  //eliminar categoria logicamente
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
