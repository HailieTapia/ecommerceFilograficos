import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CategorieService } from '../../services/categorieService';
import { ModalComponent } from '../../reusable/modal/modal.component';
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
  @ViewChild('createEditModal') createEditModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

  categories: any[] = [];
  total: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  categoryForm!: FormGroup;
  selectedCategoryId: number | null = null;
  imagePreview: string | null = null;
  selectedImageFile: File | null = null;
  filterActive: boolean | undefined = undefined;
  filterName: string = '';
  sortBy: string = 'name';
  sortOrder: 'ASC' | 'DESC' = 'ASC';
  confirmAction: (() => void) | null = null;
  confirmModalTitle: string = '';
  confirmModalMessage: string = '';
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';

  constructor(
    private toastService: ToastService,
    private categoriesService: CategorieService,
    private fb: FormBuilder
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      color_fondo: ['', [Validators.pattern(/^#([0-9A-F]{6}|[0-9A-F]{8})$/i)]],
      imagen_url: ['', [Validators.pattern(/^https?:\/\/[^\s/$.?#].[^\s]*$/i)]],
      removeImage: [false]
    });

    this.categoryForm.get('color_fondo')?.valueChanges.subscribe(value => {
      if (value && /^#[0-9A-F]{6}$/i.test(value)) {
        this.categoryForm.get('color_fondo')?.setValue(value.toUpperCase(), { emitEvent: false });
      }
    });

    this.categoryForm.get('imagen_url')?.valueChanges.subscribe(value => {
      this.updateImagePreview();
    });
  }

  ngOnInit(): void {
    this.getAllCategories();
  }

  ngAfterViewInit(): void {
    if (!this.createEditModal || !this.confirmModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }

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

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.getAllCategories();
  }

  openCreateModal(): void {
    this.selectedCategoryId = null;
    this.categoryForm.reset({ removeImage: false });
    this.imagePreview = null;
    this.selectedImageFile = null;
    if (this.createEditModal) {
      this.createEditModal.modalType = 'success';
      this.createEditModal.title = 'Nueva Categoría';
      this.createEditModal.open();
    }
  }

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
          if (this.createEditModal) {
            this.createEditModal.modalType = 'info';
            this.createEditModal.title = 'Editar Categoría';
            this.createEditModal.open();
          }
        } else {
          this.toastService.showToast('La categoría no está disponible para edición.', 'error');
        }
      },
      error: (err) => {
        this.toastService.showToast('Error al obtener la categoría.', 'error');
      }
    });
  }

  openConfirmModal(title: string, message: string, modalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default', action: () => void) {
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmModalType = modalType;
    this.confirmAction = action;
    if (this.confirmModal) {
      this.confirmModal.title = title;
      this.confirmModal.modalType = modalType;
      this.confirmModal.isConfirmModal = true;
      this.confirmModal.confirmText = 'Confirmar';
      this.confirmModal.cancelText = 'Cancelar';
      this.confirmModal.open();
    }
  }

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
        if (this.createEditModal) this.createEditModal.close();
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al guardar categoría';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  deleteCategory(categoryId: number): void {
    const category = this.categories.find(c => c.category_id === categoryId);
    if (!category) {
      this.toastService.showToast('Categoría no encontrada.', 'error');
      return;
    }
    this.openConfirmModal(
      'Eliminar Categoría',
      `¿Estás seguro de que deseas eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`,
      'danger',
      () => {
        this.categoriesService.deleteCategory(categoryId).subscribe({
          next: (response) => {
            this.toastService.showToast(response.message || 'Categoría eliminada exitosamente', 'success');
            this.getAllCategories();
            if (this.confirmModal) this.confirmModal.close();
          },
          error: (err) => {
            const errorMessage = err?.error?.message || 'Error al eliminar la categoría';
            this.toastService.showToast(errorMessage, 'error');
            if (this.confirmModal) this.confirmModal.close();
          }
        });
      }
    );
  }

  handleConfirm(): void {
    if (this.confirmAction) {
      this.confirmAction();
      this.confirmAction = null;
    }
  }

  onNameFilterChange(name: string): void {
    this.filterName = name;
    this.currentPage = 1;
    this.getAllCategories();
  }

  onActiveFilterChange(active: boolean | undefined): void {
    this.filterActive = active;
    this.currentPage = 1;
    this.getAllCategories();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    this.getAllCategories();
  }

  handleImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.setImageFile(input.files[0]);
    }
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.setImageFile(event.dataTransfer.files[0]);
    }
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
  }

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
    this.categoryForm.get('imagen_url')?.setValue('');
  }

  clearImage(): void {
    this.selectedImageFile = null;
    this.imagePreview = null;
    this.categoryForm.get('removeImage')?.setValue(true);
    this.categoryForm.get('imagen_url')?.setValue('');
  }

  updateImagePreview(): void {
    const url = this.categoryForm.get('imagen_url')?.value;
    if (url) {
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