import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ProductAttributeService } from '../../services/product-attribute.service';
import { CategorieService } from '../../services/categorieService';
import { ToastService } from '../../services/toastService';
import { AttributeCountCardsComponent } from './attribute-count-cards/attribute-count-cards.component';
import { PaginationComponent } from '../pagination/pagination.component';
import { ModalComponent } from '../../../modal/modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-attribute',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AttributeCountCardsComponent,
    PaginationComponent,
    ModalComponent
  ],
  templateUrl: './product-attribute.component.html',
  styleUrls: ['./product-attribute.component.css']
})
export class ProductAttributeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('createEditModal') createEditModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

  categoryCounts: { categoryId: string; name: string; attributeCount: number }[] = [];
  allCategories: { category_id: string; name: string }[] = [];
  selectedCategory: { categoryId: string; name: string; attributeCount: number } | null = null;
  attributes: { attribute_id: string; attribute_name: string; data_type: string; allowed_values: string }[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  attributeForm: FormGroup;
  selectedAttributeId: string | null = null;
  confirmAction: (() => void) | null = null;
  confirmModalTitle: string = '';
  confirmModalMessage: string = '';
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';
  private subscriptions: Subscription = new Subscription();

  // Whitelist para valores booleanos
  private booleanWhitelist = ['true', 'false', '1', '0', 'verdadero', 'falso', 'permitido', 'no permitido', 'si', 'no', 'Si', 'No'];

  constructor(
    private productAttributeService: ProductAttributeService,
    private categorieService: CategorieService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.attributeForm = this.fb.group({
      attribute_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      data_type: ['lista', [Validators.required]],
      allowed_values: [''],
      category_id: ['', [Validators.required]]
    });

    // Suscribirse a cambios en data_type para actualizar las validaciones de allowed_values
    this.subscriptions.add(
      this.attributeForm.get('data_type')?.valueChanges.subscribe((dataType) => {
        const allowedValuesControl = this.attributeForm.get('allowed_values');
        allowedValuesControl?.clearValidators();
        allowedValuesControl?.setValidators(this.getAllowedValuesValidator(dataType));
        allowedValuesControl?.updateValueAndValidity();
      })
    );
  }

  ngOnInit(): void {
    this.loadAttributeCounts();
    this.loadAllCategories();
  }

  ngAfterViewInit(): void {
    if (!this.createEditModal || !this.confirmModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Validador personalizado para allowed_values según el data_type
  private getAllowedValuesValidator(dataType: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value ? control.value.trim() : '';
      if (!value) return null; // Si está vacío, es válido (opcional)

      const values = value.split(',').map((v: string) => v.trim());

      switch (dataType) {
        case 'texto':
          return null; // Cualquier texto es válido

        case 'numero':
          const numberRegex = /^\d+$/;
          const allNumbers = values.every((v: string) => numberRegex.test(v));
          return allNumbers ? null : { invalidNumber: 'Solo se permiten números enteros separados por comas (ej. 12, 39, 90)' };

        case 'boolean':
          const allBooleans = values.every((v: string) => this.booleanWhitelist.includes(v.toLowerCase()));
          return allBooleans ? null : { invalidBoolean: 'Solo se permiten valores booleanos válidos separados por comas (ej. true, false, 1, 0, verdadero, falso)' };

        case 'lista':
          return null; // Cualquier combinación es válida para 'lista'

        default:
          return null;
      }
    };
  }

  loadAttributeCounts(): void {
    this.subscriptions.add(
      this.productAttributeService.getAttributeCountByCategory().subscribe({
        next: (response) => {
          const data = Array.isArray(response) ? response : [];
          this.categoryCounts = data.map((item: any) => ({
            categoryId: item?.category_id?.toString() ?? 'N/A',
            name: item?.category_name ?? 'Categoría Desconocida',
            attributeCount: item?.attribute_count ?? 0
          }));
          if (this.selectedCategory) {
            const updatedCategory = this.categoryCounts.find(cat => cat.categoryId === this.selectedCategory!.categoryId);
            this.selectedCategory = updatedCategory || null;
            if (!updatedCategory) {
              const firstValidCategory = this.categoryCounts.find(category => category.categoryId !== 'N/A');
              if (firstValidCategory) {
                this.selectCategory(firstValidCategory);
              } else {
                this.attributes = [];
                this.totalItems = 0;
              }
            } else {
              this.loadAttributesByCategory();
            }
          } else {
            const firstValidCategory = this.categoryCounts.find(category => category.categoryId !== 'N/A');
            if (firstValidCategory) {
              this.selectCategory(firstValidCategory);
            }
          }
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar conteos de atributos';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  loadAllCategories(): void {
    this.subscriptions.add(
      this.categorieService.getCategories().subscribe({
        next: (response) => {
          const data = Array.isArray(response) ? response : [];
          this.allCategories = data.map((cat: any) => ({
            category_id: cat.category_id.toString(),
            name: cat.name
          }));
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar todas las categorías';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  selectCategory(category: { categoryId: string; name: string; attributeCount: number }): void {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.attributeForm.patchValue({ category_id: category.categoryId });
    this.loadAttributesByCategory();
  }

  loadAttributesByCategory(): void {
    if (!this.selectedCategory || this.selectedCategory.categoryId === 'N/A') {
      this.attributes = [];
      this.totalItems = 0;
      return;
    }

    this.subscriptions.add(
      this.productAttributeService.getAttributesByCategory(this.selectedCategory.categoryId, this.currentPage, this.itemsPerPage).subscribe({
        next: (response) => {
          this.attributes = response.data.map((attr: any) => ({
            attribute_id: attr.attribute_id.toString(),
            attribute_name: attr.attribute_name,
            data_type: attr.data_type,
            allowed_values: attr.allowed_values
          }));
          this.totalItems = response.total || 0;
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar atributos de la categoría';
          this.toastService.showToast(errorMessage, 'error');
          this.attributes = [];
          this.totalItems = 0;
        }
      })
    );
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadAttributesByCategory();
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadAttributesByCategory();
  }

  openCreateModal(): void {
    if (!this.createEditModal) {
      this.toastService.showToast('Error: Modal de creación no inicializado', 'error');
      return;
    }
    this.selectedAttributeId = null;
    this.attributeForm.reset({ data_type: 'lista', category_id: this.selectedCategory?.categoryId || '' });
    this.createEditModal.modalType = 'success';
    this.createEditModal.title = 'Nuevo Atributo';
    this.createEditModal.open();
  }

  openEditModal(attributeId: string): void {
    if (!this.createEditModal) {
      this.toastService.showToast('Error: Modal de edición no inicializado', 'error');
      return;
    }
    this.selectedAttributeId = attributeId;
    const attribute = this.attributes.find(attr => attr.attribute_id === attributeId);
    if (attribute) {
      this.attributeForm.patchValue({
        attribute_name: attribute.attribute_name,
        data_type: attribute.data_type,
        allowed_values: attribute.allowed_values,
        category_id: this.selectedCategory?.categoryId
      });
      this.createEditModal.modalType = 'info';
      this.createEditModal.title = 'Editar Atributo';
      this.createEditModal.open();
    }
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

  saveAttribute(): void {
    if (this.attributeForm.invalid) {
      this.attributeForm.markAllAsTouched();
      this.toastService.showToast('Formulario inválido. Revisa los campos.', 'error');
      return;
    }

    const attributeData = this.attributeForm.value;

    const serviceCall = this.selectedAttributeId
      ? this.productAttributeService.updateAttribute(this.selectedAttributeId, attributeData)
      : this.productAttributeService.createAttribute(attributeData);

    this.subscriptions.add(
      serviceCall.subscribe({
        next: () => {
          this.toastService.showToast(
            this.selectedAttributeId ? 'Atributo actualizado exitosamente' : 'Atributo creado exitosamente',
            'success'
          );
          this.loadAttributesByCategory();
          this.loadAttributeCounts();
          if (this.createEditModal) this.createEditModal.close();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al guardar el atributo';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  deleteAttribute(attributeId: string): void {
    const attribute = this.attributes.find(attr => attr.attribute_id === attributeId);
    this.openConfirmModal(
      'Eliminar Atributo',
      `¿Estás seguro de que deseas eliminar el atributo "${attribute?.attribute_name || 'Desconocido'}"?`,
      'danger',
      () => {
        this.subscriptions.add(
          this.productAttributeService.deleteAttribute(attributeId).subscribe({
            next: () => {
              this.toastService.showToast('Atributo eliminado exitosamente', 'success');
              this.loadAttributesByCategory();
              this.loadAttributeCounts();
              if (this.confirmModal) this.confirmModal.close();
            },
            error: (err) => {
              const errorMessage = err?.error?.message || 'Error al eliminar el atributo';
              this.toastService.showToast(errorMessage, 'error');
              if (this.confirmModal) this.confirmModal.close();
            }
          })
        );
      }
    );
  }
}