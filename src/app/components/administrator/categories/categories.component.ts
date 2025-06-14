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
  imagePreview: string | null = null; // Para previsualización de imagen
  selectedImageFile: File | null = null; // Archivo de imagen seleccionado

  // Propiedades para los filtros y ordenamiento
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
      description: ['', [Validators.maxLength(500)]],
      color_fondo: ['', [Validators.pattern(/^#([0-9A-F]{6}|[0-9A-F]{8})$/i)]], // Validar hexadecimal
      imagen_url: ['', [Validators.pattern(/^https?:\/\/[^\s/$.?#].[^\s]*$/i)]], // Validar URL válida
      removeImage: [false] // Para eliminar imagen en edición
    });

    // Sincronizar color_fondo
    this.categoryForm.get('color_fondo')?.valueChanges.subscribe(value => {
      if (value && /^#[0-9A-F]{6}$/i.test(value)) {
        this.categoryForm.get('color_fondo')?.setValue(value.toUpperCase(), { emitEvent: false });
      }
    });

    // Sincronizar imagen_url con previsualización
    this.categoryForm.get('imagen_url')?.valueChanges.subscribe(value => {
      this.updateImagePreview();
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

  // Obtener todas las categorías con filtros y ordenamiento
  getAllCategories(): void {
    this.categoriesService
      .getAllCategories(
        this.currentPage,
        this.itemsPerPage,
        this.filterActive,
        this.filterName,
        this.sortBy,
        this.sortOrder
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

  // Maneja el cambio de página
  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.getAllCategories();
  }

  // Abrir modal para crear categoría
  openCreateModal(): void {
    this.selectedCategoryId = null;
    this.categoryForm.reset();
    this.imagePreview = null;
    this.selectedImageFile = null;
    this.modal.open();
  }

  // Abrir modal para editar categoría
  openEditModal(categoryId: number): void {
    this.selectedCategoryId = categoryId;
    this.categoriesService.getCategoryById(categoryId).subscribe({
      next: (category) => {
        if (category && category.active === true) {
          this.categoryForm.patchValue({
            name: category.name,
            description: category.description,
            color_fondo: category.color_fondo,
            imagen_url: category.imagen_url,
            removeImage: false
          });
          this.imagePreview = category.imagen_url || null;
          this.selectedImageFile = null;
          this.modal.open();
        } else {
          this.toastService.showToast('La categoría no está disponible para edición.', 'error');
        }
      },
      error: (err) => {
        this.toastService.showToast('Error al obtener la categoría.', 'error');
      }
    });
  }

  // Guardar categoría (crear o actualizar)
  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      this.toastService.showToast('Formulario inválido. Revisa los campos.', 'error');
      return;
    }

    const categoryData = {
      name: this.categoryForm.get('name')?.value,
      description: this.categoryForm.get('description')?.value,
      color_fondo: this.categoryForm.get('color_fondo')?.value || undefined,
      imagen_url: this.categoryForm.get('imagen_url')?.value || undefined,
      image: this.selectedImageFile || undefined,
      removeImage: this.categoryForm.get('removeImage')?.value || undefined
    };

    // Si hay imagen_url, ignorar image y removeImage
    if (categoryData.imagen_url) {
      categoryData.image = undefined;
      categoryData.removeImage = undefined;
    }

    const saveAction = this.selectedCategoryId
      ? this.categoriesService.updateCategory(this.selectedCategoryId, categoryData)
      : this.categoriesService.createCategory(categoryData);

    saveAction.subscribe({
      next: () => {
        this.toastService.showToast(
          this.selectedCategoryId ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente',
          'success'
        );
        this.getAllCategories();
        this.modal.close();
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al guardar categoría';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  // Eliminar categoría
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

  // Manejar cambio en el filtro por nombre
  onNameFilterChange(name: string): void {
    this.filterName = name;
    this.currentPage = 1;
    this.getAllCategories();
  }

  // Manejar cambio en el filtro de estado
  onActiveFilterChange(active: boolean | undefined): void {
    this.filterActive = active;
    this.currentPage = 1;
    this.getAllCategories();
  }

  // Alternar ordenamiento
  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    this.getAllCategories();
  }

  // Manejar selección de archivo de imagen
  handleImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.setImageFile(input.files[0]);
    }
  }

  // Manejar drag-and-drop de imagen
  handleDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.setImageFile(event.dataTransfer.files[0]);
    }
  }

  // Prevenir comportamiento por defecto en dragover
  handleDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  // Establecer archivo de imagen y generar previsualización
  private setImageFile(file: File): void {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.toastService.showToast('Solo se permiten imágenes JPG, PNG o WebP.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.toastService.showToast('La imagen no debe exceder 2MB.', 'error');
      return;
    }
    this.selectedImageFile = file;
    this.imagePreview = URL.createObjectURL(file);
    this.categoryForm.get('removeImage')?.setValue(false);
    this.categoryForm.get('imagen_url')?.setValue(''); // Limpiar URL si se sube archivo
  }

  // Limpiar imagen seleccionada
  clearImage(): void {
    this.selectedImageFile = null;
    this.imagePreview = null;
    this.categoryForm.get('removeImage')?.setValue(true);
    this.categoryForm.get('imagen_url')?.setValue('');
  }

  // Actualizar previsualización desde URL
  updateImagePreview(): void {
    const url = this.categoryForm.get('imagen_url')?.value;
    if (url) {
      // Intentar cargar la imagen para validar
      const img = new Image();
      img.src = url;
      img.onload = () => {
        this.imagePreview = url;
        this.selectedImageFile = null;
        this.categoryForm.get('removeImage')?.setValue(false);
      };
      img.onerror = () => {
        this.imagePreview = null;
        this.toastService.showToast('No se pudo cargar la imagen desde la URL proporcionada.', 'error');
      };
    } else {
      this.imagePreview = this.selectedImageFile ? URL.createObjectURL(this.selectedImageFile) : null;
    }
  }
}