import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ProductService, NewProduct, Variant } from '../../../services/product.service';
import { CategorieService } from '../../../services/categorieService';
import { CollaboratorsService } from '../../../services/collaborators.service';
import { ProductAttributeService, Attribute, CategoryWithAttributes } from '../../../services/product-attribute.service';
import { SafeUrlPipe } from '../../../pipes/safe-url.pipe';

interface Category {
  category_id: number;
  name: string;
}

interface Collaborator {
  collaborator_id: number;
  name: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  category_id?: string;
  product_type?: string;
  customizations?: string;
  sku?: string;
  production_cost?: string;
  profit_margin?: string;
  calculated_price?: string;
  [key: string]: string | undefined;
}

@Component({
  selector: 'app-product-catalog-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SafeUrlPipe, NgFor],
  templateUrl: './product-catalog-form.component.html'
})
export class ProductCatalogFormComponent implements OnInit {
  @Output() productSaved = new EventEmitter<void>();

  currentStep = 1;
  productForm: FormGroup;
  errors: FormErrors = {};

  categories: Category[] = [];
  collaborators: Collaborator[] = [];
  attributesByCategory: { [key: number]: Attribute[] } = {};

  readonly MAX_PROFIT_MARGIN: number = 500;

  constructor(
    private productService: ProductService,
    private categorieService: CategorieService,
    private collaboratorsService: CollaboratorsService,
    private productAttributeService: ProductAttributeService,
    private fb: FormBuilder
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), Validators.pattern(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s_-]+$/)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500), Validators.pattern(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s_-]+$/)]],
      category_id: [null, Validators.required],
      collaborator_id: [null],
      product_type: ['', Validators.required],
      customizations: this.fb.array([]),
      variants: this.fb.array([this.createVariantFormGroup()], this.uniqueSkuValidator.bind(this))
    });
  }

  get customizations(): FormArray<FormGroup> {
    return this.productForm.get('customizations') as FormArray<FormGroup>;
  }

  get variants(): FormArray<FormGroup> {
    return this.productForm.get('variants') as FormArray<FormGroup>;
  }

  createVariantFormGroup(sku: string = ''): FormGroup {
    return this.fb.group({
      id: [1],
      sku: [sku, [Validators.required, Validators.pattern(/^[A-Z]{4}-\d{3}$/), Validators.maxLength(8)]],
      attributes: this.fb.group({}),
      production_cost: [null, [Validators.required, Validators.min(0)]],
      profit_margin: [null, [Validators.required, Validators.min(0.01), Validators.max(this.MAX_PROFIT_MARGIN)]],
      calculated_price: [{ value: 0, disabled: true }],
      images: [[]]
    });
  }

  uniqueSkuValidator(control: AbstractControl): ValidationErrors | null {
    const variants = control as FormArray;
    const skus = variants.controls.map(v => v.get('sku')?.value).filter(sku => sku);
    const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index);
    return duplicates.length > 0 ? { duplicateSku: true } : null;
  }

  generateSKU(productName: string, variantIndex: number): string {
    const base = (productName.substring(0, 4) || 'PROD').toUpperCase();
    const digits = (variantIndex + 1).toString().padStart(3, '0');
    return `${base}-${digits}`;
  }

  ngOnInit() {
    this.loadCategories();
    this.loadCollaborators();
    this.loadAttributesByActiveCategories();

    this.productForm.get('category_id')?.valueChanges.subscribe(value => this.updateVariantAttributes(value));
    this.productForm.get('product_type')?.valueChanges.subscribe(() => this.validateStep1());

    this.productForm.get('name')?.valueChanges.subscribe(value => {
      if (value) {
        const capitalizedValue = this.capitalizeFirstWord(value);
        if (capitalizedValue !== value) {
          this.productForm.get('name')?.setValue(capitalizedValue, { emitEvent: false });
        }
      }
    });

    this.productForm.get('description')?.valueChanges.subscribe(value => {
      if (value) {
        const capitalizedValue = this.capitalizeFirstWord(value);
        if (capitalizedValue !== value) {
          this.productForm.get('description')?.setValue(capitalizedValue, { emitEvent: false });
        }
      }
    });

    this.variants.valueChanges.subscribe(() => {
      this.variants.controls.forEach(variant => this.calculatePrice(variant as FormGroup));
      this.updateErrors();
    });
  }

  capitalizeFirstWord(text: string): string {
    if (!text) return text;
    const words = text.split(/\s+/);
    if (words.length > 0) {
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
      return words.join(' ');
    }
    return text;
  }

  loadCategories() {
    this.categorieService.getCategories().subscribe({
      next: (response: any[]) => {
        this.categories = response.map(cat => ({
          category_id: cat.category_id,
          name: cat.name
        }));
      },
      error: (err) => console.error('Error al cargar categorías:', err)
    });
  }

  loadCollaborators() {
    this.collaboratorsService.getAllCollaborators().subscribe({
      next: (response: any[]) => {
        this.collaborators = response.filter(col => col.active).map(col => ({
          collaborator_id: col.collaborator_id,
          name: col.name
        }));
      },
      error: (err) => console.error('Error al cargar colaboradores:', err)
    });
  }

  loadAttributesByActiveCategories() {
    this.productAttributeService.getAttributesByActiveCategories().subscribe({
      next: (response: CategoryWithAttributes[]) => {
        this.attributesByCategory = response.reduce((acc, category) => {
          acc[category.category_id] = category.attributes.map(attr => ({
            attribute_id: attr.attribute_id,
            attribute_name: attr.attribute_name,
            data_type: attr.data_type,
            allowed_values: attr.allowed_values, // Mantenemos como string | undefined según la interfaz
            is_required: attr.is_required || false
          }));
          return acc;
        }, {} as { [key: number]: Attribute[] });
      },
      error: (err) => console.error('Error al cargar atributos por categorías activas:', err)
    });
  }

  updateVariantAttributes(categoryId: number | null) {
    if (!categoryId || !this.attributesByCategory[categoryId]) {
      this.variants.controls.forEach(variant => {
        const attributesGroup = variant.get('attributes') as FormGroup;
        Object.keys(attributesGroup.controls).forEach(key => attributesGroup.removeControl(key));
      });
      return;
    }

    const attributes = this.attributesByCategory[categoryId];
    this.variants.controls.forEach(variant => {
      const attributesGroup = variant.get('attributes') as FormGroup;
      Object.keys(attributesGroup.controls).forEach(key => attributesGroup.removeControl(key));
      attributes.forEach(attr => {
        const validators = attr.is_required ? [Validators.required] : [];
        attributesGroup.addControl(
          attr.attribute_id.toString(),
          this.fb.control('', validators)
        );
      });
    });
  }

  addCustomization() {
    const customizationGroup = this.fb.group({
      type: ['', Validators.required],
      description: ['']
    });

    customizationGroup.get('type')?.valueChanges.subscribe(type => {
      if (type && !customizationGroup.get('description')?.touched) {
        let defaultDescription = '';
        switch (type) {
          case 'Imagen':
            defaultDescription = 'Ej: Sube tu diseño';
            break;
          case 'Texto':
            defaultDescription = 'Ej: Escribe tu mensaje';
            break;
          case 'Archivo':
            defaultDescription = 'Ej: Sube tu archivo PDF';
            break;
        }
        customizationGroup.get('description')?.setValue(defaultDescription);
      }
    });

    this.customizations.push(customizationGroup);
  }

  removeCustomization(index: number) {
    this.customizations.removeAt(index);
  }

  isCustomizationRequired(): boolean {
    const productType = this.productForm.get('product_type')?.value;
    return productType === 'semi_personalizado' || productType === 'personalizado';
  }

  validateStep1(): boolean {
    const newErrors: FormErrors = {};

    if (this.productForm.get('name')?.invalid) {
      if (this.productForm.get('name')?.errors?.['required']) newErrors['name'] = 'El nombre es obligatorio';
      else if (this.productForm.get('name')?.errors?.['pattern']) newErrors['name'] = 'Solo se permiten letras, números, acentos, ñ, espacios, guiones y guiones bajos';
      else if (this.productForm.get('name')?.errors?.['minlength'] || this.productForm.get('name')?.errors?.['maxlength']) newErrors['name'] = 'El nombre debe tener entre 3 y 100 caracteres';
    }
  
    if (this.productForm.get('description')?.invalid) {
      if (this.productForm.get('description')?.errors?.['required']) newErrors['description'] = 'La descripción es obligatoria';
      else if (this.productForm.get('description')?.errors?.['pattern']) newErrors['description'] = 'Solo se permiten letras, números, acentos, ñ, espacios, guiones y guiones bajos';
      else if (this.productForm.get('description')?.errors?.['minlength'] || this.productForm.get('description')?.errors?.['maxlength']) newErrors['description'] = 'La descripción debe tener entre 10 y 500 caracteres';
    }

    if (this.productForm.get('category_id')?.invalid) {
      newErrors['category_id'] = 'Selecciona una categoría';
    }

    if (this.productForm.get('product_type')?.invalid) {
      newErrors['product_type'] = 'Selecciona un tipo de producto';
    }

    if (this.isCustomizationRequired() && this.customizations.length === 0) {
      newErrors['customizations'] = 'Agrega al menos una opción de personalización';
    } else if (this.isCustomizationRequired()) {
      this.customizations.controls.forEach((control, index) => {
        if (control.get('type')?.invalid) {
          newErrors[`customization_${index}_type`] = 'El tipo es obligatorio';
        }
      });
    }

    this.errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  goToNextStep() {
    if (this.validateStep1()) {
      const step1Data = {
        name: this.productForm.get('name')?.value,
        description: this.productForm.get('description')?.value,
        category_id: this.productForm.get('category_id')?.value,
        collaborator_id: this.productForm.get('collaborator_id')?.value,
        product_type: this.productForm.get('product_type')?.value,
        customizations: this.customizations.value
      };
      console.log('Datos del Paso 1 al pasar al Paso 2:', step1Data);

      const productName = this.productForm.get('name')?.value;
      this.variants.controls.forEach((variant, index) => {
        const sku = this.generateSKU(productName, index);
        variant.get('sku')?.setValue(sku);
      });

      this.currentStep = 2;
      this.updateErrors();
    }
  }

  goToPreviousStep() {
    this.currentStep = 1;
  }

  generateNewId(): number {
    return Math.max(...this.variants.controls.map(v => v.get('id')?.value || 0), 0) + 1;
  }

  addVariant() {
    const productName = this.productForm.get('name')?.value || 'PROD';
    const newVariantIndex = this.variants.length;
    const sku = this.generateSKU(productName, newVariantIndex);
    const newVariant = this.createVariantFormGroup(sku);
    newVariant.patchValue({ id: this.generateNewId() });
    const categoryId = this.productForm.get('category_id')?.value;
    if (categoryId) {
      this.updateVariantAttributes(categoryId);
    }
    this.variants.push(newVariant);
    this.updateErrors();
  }

  removeVariant(index: number) {
    if (this.variants.length > 1) {
      this.variants.removeAt(index);
      this.updateErrors();
    }
  }

  handleImageUpload(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newImages = Array.from(input.files);
      const variant = this.variants.at(index);
      const currentImages = variant.get('images')?.value || [];
      variant.patchValue({ images: [...currentImages, ...newImages].slice(0, 10) });
    }
  }

  removeImage(variantIndex: number, imageIndex: number) {
    const variant = this.variants.at(variantIndex);
    const images = [...variant.get('images')?.value];
    images.splice(imageIndex, 1);
    variant.patchValue({ images });
  }

  calculatePrice(variant: FormGroup) {
    const cost = variant.get('production_cost')?.value || 0;
    const margin = variant.get('profit_margin')?.value || 0;
    const calculated = parseFloat((cost * (1 + margin / 100)).toFixed(2));
    variant.get('calculated_price')?.setValue(calculated);
    this.validatePrice(variant);
  }

  validatePrice(variant: FormGroup) {
    const index = this.variants.controls.indexOf(variant);
    const cost = variant.get('production_cost')?.value || 0;
    const margin = variant.get('profit_margin')?.value || 0;
    const calculated = variant.get('calculated_price')?.value || 0;

    if (cost < 0) {
      this.errors[`production_cost_${index}`] = 'El costo de producción debe ser positivo';
    } else {
      delete this.errors[`production_cost_${index}`];
    }

    if (margin < 0.01 || margin > this.MAX_PROFIT_MARGIN) {
      this.errors[`profit_margin_${index}`] = `El margen de ganancia debe estar entre 0.01% y ${this.MAX_PROFIT_MARGIN}%`;
    } else {
      delete this.errors[`profit_margin_${index}`];
    }

    if (calculated < cost) {
      this.errors[`calculated_price_${index}`] = `El precio debe ser mayor a $${cost.toFixed(2)}`;
    } else {
      delete this.errors[`calculated_price_${index}`];
    }
  }

  restrictInput(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', '.'];
    const isNumberKey = event.key >= '0' && event.key <= '9';
    const isAllowedSpecialKey = allowedKeys.includes(event.key);

    if (!isNumberKey && !isAllowedSpecialKey) {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement;
    const value = input.value;
    const dotIndex = value.indexOf('.');

    if (event.key === '.' && dotIndex !== -1) {
      event.preventDefault();
      return;
    }

    if (dotIndex !== -1 && value.length - dotIndex > 2 && !allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  updateErrors() {
    const newErrors: FormErrors = { ...this.errors };
    const skus = new Set<string>();

    this.variants.controls.forEach((variant, index) => {
      const skuControl = variant.get('sku');
      const sku = skuControl?.value;
      delete newErrors[`sku_${index}`];

      if (!sku?.trim()) {
        newErrors[`sku_${index}`] = 'El SKU es obligatorio';
      } else if (skuControl?.errors?.['pattern']) {
        newErrors[`sku_${index}`] = 'El SKU debe tener el formato AAAA-123 (4 letras mayúsculas, guión, 3 dígitos)';
      } else if (skus.has(sku)) {
        newErrors[`sku_${index}`] = 'El SKU ya existe en otra variante';
      } else {
        skus.add(sku);
      }

      this.validatePrice(variant as FormGroup);

      const attributesGroup = variant.get('attributes') as FormGroup;
      const categoryId = this.productForm.get('category_id')?.value;
      if (categoryId && this.attributesByCategory[categoryId]) {
        this.attributesByCategory[categoryId].forEach(attr => {
          const attrControl = attributesGroup.get(attr.attribute_id.toString());
          if (attr.is_required && (!attrControl?.value || attrControl.value.trim() === '')) {
            newErrors[`attribute_${attr.attribute_id}_${index}`] = `${attr.attribute_name} es obligatorio`;
          } else {
            delete newErrors[`attribute_${attr.attribute_id}_${index}`];
          }
        });
      }
    });

    this.errors = newErrors;
  }

  validateStep2(): boolean {
    this.updateErrors();
    const hasErrors = this.variants.controls.some((v, i) =>
      this.errors[`sku_${i}`] ||
      this.errors[`production_cost_${i}`] ||
      this.errors[`profit_margin_${i}`] ||
      this.errors[`calculated_price_${i}`] ||
      v.get('images')?.value.length === 0 ||
      Object.keys((v.get('attributes') as FormGroup).controls).some(key => this.errors[`attribute_${key}_${i}`])
    );

    return !hasErrors;
  }

  saveProduct() {
    if (!this.validateStep2()) {
      window.alert('Por favor corrige los errores en las variantes antes de guardar');
      return;
    }

    const productData: NewProduct = {
      name: this.productForm.get('name')?.value as string,
      description: this.productForm.get('description')?.value as string,
      product_type: this.productForm.get('product_type')?.value as 'Existencia' | 'semi_personalizado' | 'personalizado',
      category_id: this.productForm.get('category_id')?.value as number,
      collaborator_id: this.productForm.get('collaborator_id')?.value || undefined,
      variants: this.variants.controls.map((variant) => {
        const attributesGroup = variant.get('attributes') as FormGroup;
        const categoryId = this.productForm.get('category_id')?.value;
        const attributes = this.attributesByCategory[categoryId] || [];
        return {
          sku: variant.get('sku')?.value as string,
          production_cost: variant.get('production_cost')?.value as number,
          profit_margin: variant.get('profit_margin')?.value as number,
          stock: 0,
          attributes: Object.entries(attributesGroup.value).map(([key, value]) => ({
            attribute_id: parseInt(key),
            value: value as string
          })),
          images: variant.get('images')?.value as File[]
        };
      }),
      customizations: this.customizations.length > 0 ? this.customizations.value : undefined
    };

    this.productService.createProduct(productData).subscribe({
      next: (response) => {
        console.log('Producto creado:', response);
        window.alert('Producto guardado con éxito');
        this.productSaved.emit();
      },
      error: (err) => {
        console.error('Error al guardar producto:', err);
        window.alert('Error al guardar el producto');
      }
    });
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  getAttributesForCategory(categoryId: number): Attribute[] {
    return this.attributesByCategory[categoryId] || [];
  }

  getAttributeKeys(categoryId: number): string[] {
    return this.getAttributesForCategory(categoryId).map(attr => attr.attribute_id.toString());
  }

  trackByIndex(index: number): number {
    return index;
  }

  getVariantAttributes(index: number): FormGroup {
    return this.variants.at(index).get('attributes') as FormGroup;
  }

  // Método auxiliar para convertir allowed_values a un array
  getAllowedValuesAsArray(allowedValues: string | undefined): string[] {
    return allowedValues ? allowedValues.split(',').map(value => value.trim()) : [];
  }
}