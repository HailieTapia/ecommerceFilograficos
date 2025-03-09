import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ProductService, NewProduct } from '../../../../services/product.service';
import { CollaboratorsService } from '../../../../services/collaborators.service';
import { ProductAttributeService } from '../../../../services/product-attribute.service';
import { Subscription } from 'rxjs';

interface CategoryWithAttributes {
  category_id: number;
  category_name: string;
  attributes: any[];
}

interface Collaborator {
  collaborator_id: number;
  name: string;
  active: boolean;
}

@Component({
  selector: 'app-product-general-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-general-info.component.html',
  styleUrls: ['./product-general-info.component.css']
})
export class ProductGeneralInfoComponent implements OnInit, OnDestroy, OnChanges {
  @Input() initialData: Partial<NewProduct> = {};
  @Output() formData = new EventEmitter<Partial<NewProduct>>();

  generalInfoForm: FormGroup;
  categories: CategoryWithAttributes[] = [];
  collaborators: Collaborator[] = [];
  isLoadingCategories = false;
  isLoadingCollaborators = false;
  private formSubscription: Subscription;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private collaboratorService: CollaboratorsService,
    private productAttributeService: ProductAttributeService
  ) {
    this.generalInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255), Validators.pattern(/^(?! )[a-zA-Z0-9]+( [a-zA-Z0-9]+)*(?<! )$/)]],
      description: ['', Validators.maxLength(2000)],
      product_type: ['', Validators.required],
      category_id: [null, Validators.required],
      collaborator_id: [null],
      customizations: this.fb.array([])
    });

    this.formSubscription = this.generalInfoForm.valueChanges.subscribe(() => this.emitFormData());
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadCollaborators();
    this.patchInitialData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && changes['initialData'].currentValue) {
      this.patchInitialData();
    }
  }

  ngOnDestroy(): void {
    this.formSubscription.unsubscribe();
  }

  get customizations(): FormArray {
    return this.generalInfoForm.get('customizations') as FormArray;
  }

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.productAttributeService.getAttributesByActiveCategories().subscribe({
      next: (data: CategoryWithAttributes[]) => {
        this.categories = data;
        this.isLoadingCategories = false;
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.isLoadingCategories = false;
      }
    });
  }

  loadCollaborators(): void {
    this.isLoadingCollaborators = true;
    this.collaboratorService.getAllCollaborators().subscribe({
      next: (data: Collaborator[]) => {
        this.collaborators = data.filter(col => col.active);
        this.isLoadingCollaborators = false;
      },
      error: (err) => {
        console.error('Error al cargar colaboradores:', err);
        this.isLoadingCollaborators = false;
      }
    });
  }

  patchInitialData(): void {
    this.generalInfoForm.patchValue({
      name: this.initialData.name || '',
      description: this.initialData.description || '',
      product_type: this.initialData.product_type || '',
      category_id: this.initialData.category_id || null,
      collaborator_id: this.initialData.collaborator_id || null
    }, { emitEvent: false }); // Evitar emitir valueChanges al cargar datos iniciales

    const initialCustomizations = this.initialData.customizations || [];
    if (initialCustomizations.length !== this.customizations.length ||
        !initialCustomizations.every((cust, i) => 
          cust.type === this.customizations.at(i)?.get('type')?.value && 
          cust.description === this.customizations.at(i)?.get('description')?.value)) {
      this.customizations.clear({ emitEvent: false }); // Limpiar solo si es diferente
      initialCustomizations.forEach(cust => {
        this.customizations.push(this.fb.group({
          type: [cust.type, Validators.required],
          description: [cust.description || '']
        }), { emitEvent: false });
      });
    }
  }

  addCustomization(): void {
    this.customizations.push(this.fb.group({
      type: ['', Validators.required],
      description: ['']
    }));
  }

  removeCustomization(index: number): void {
    this.customizations.removeAt(index);
  }

  isCustomizationRequired(): boolean {
    const productType = this.generalInfoForm.get('product_type')?.value;
    return productType === 'semi_personalizado' || productType === 'personalizado';
  }

  isFormValid(): boolean {
    if (!this.generalInfoForm.valid) return false;
    if (this.isCustomizationRequired() && this.customizations.length === 0) return false;
    if (this.isCustomizationRequired() && !this.customizations.controls.every(c => c.valid)) return false;
    return true;
  }

  emitFormData(): void {
    if (this.isFormValid()) {
      const formValue = this.generalInfoForm.value;
      this.formData.emit({
        name: formValue.name,
        description: formValue.description || undefined,
        product_type: formValue.product_type as 'Existencia' | 'semi_personalizado' | 'personalizado',
        category_id: formValue.category_id,
        collaborator_id: formValue.collaborator_id === '' ? undefined : formValue.collaborator_id,
        customizations: formValue.customizations.length ? formValue.customizations : undefined
      });
    }
  }

  getDescriptionLength(): number {
    return this.generalInfoForm.get('description')?.value?.length || 0;
  }

  trackByIndex(index: number): number {
    return index; // Ayuda a Angular a mantener la identidad de los elementos en el DOM
  }
}