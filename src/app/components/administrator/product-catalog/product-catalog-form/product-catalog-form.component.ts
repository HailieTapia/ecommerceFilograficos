import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, NewProduct } from '../../../services/product.service';
import { CategorieService } from '../../../services/categorieService';
import { CollaboratorsService } from '../../../services/collaborators.service';
import { SafeUrlPipe } from '../../../pipes/safe-url.pipe';

interface Category {
  category_id: number;
  name: string;
}

interface Collaborator {
  collaborator_id: number;
  name: string;
}

interface Attribute {
  attribute_id: number;
  name: string;
  options: string[];
}

interface Variant {
  id: number;
  sku: string;
  attributes: { [key: string]: string };
  production_cost: number | null;
  profit_margin: number | null;
  calculated_price: number;
  images: File[];
}

interface FormErrors {
  name?: string;
  description?: string;
  category_id?: string;
  product_type?: string;
  customizations?: string;
  [key: string]: string | undefined;
}

@Component({
  selector: 'app-product-catalog-form',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeUrlPipe],
  templateUrl: './product-catalog-form.component.html'
})
export class ProductCatalogFormComponent implements OnInit {
  @Output() productSaved = new EventEmitter<void>();

  currentStep = 1;

  basicInfo = {
    name: '',
    description: '',
    category_id: null as number | null,
    collaborator_id: null as number | null,
    product_type: '' as 'Existencia' | 'semi_personalizado' | 'personalizado' | '',
    customizations: {
      text: false,
      image: false,
      file: false
    }
  };

  errors: FormErrors = {};

  variants: Variant[] = [{
    id: 1,
    sku: '',
    attributes: {},
    production_cost: null,
    profit_margin: null,
    calculated_price: 0,
    images: []
  }];

  categories: Category[] = [];
  collaborators: Collaborator[] = [];
  attributes: { [key: string]: Attribute } = {};

  constructor(
    private productService: ProductService,
    private categorieService: CategorieService,
    private collaboratorsService: CollaboratorsService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadCollaborators();
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

  loadAttributes(categoryId: number | null) {
    if (!categoryId) {
      this.attributes = {};
      return;
    }
    if (categoryId === 1) {
      this.attributes = {
        light_type: { attribute_id: 1, name: 'Tipo de luz', options: ['Cálida', 'Fría'] },
        material: { attribute_id: 2, name: 'Material', options: ['Plástico', 'Metal'] }
      };
    } else if (categoryId === 2) {
      this.attributes = {
        material: { attribute_id: 3, name: 'Material', options: ['Cerámica', 'Plástico'] },
        size: { attribute_id: 4, name: 'Tamaño', options: ['Pequeño', 'Mediano', 'Grande'] },
        color: { attribute_id: 5, name: 'Color', options: ['Blanco', 'Negro', 'Azul'] }
      };
    } else {
      this.attributes = {
        size: { attribute_id: 6, name: 'Tamaño', options: ['S', 'M', 'L', 'XL'] },
        color: { attribute_id: 7, name: 'Color', options: ['Rojo', 'Verde', 'Azul', 'Negro'] }
      };
    }

    this.variants = this.variants.map(variant => ({
      ...variant,
      attributes: Object.keys(this.attributes).reduce((acc, key) => {
        acc[key] = '';
        return acc;
      }, {} as { [key: string]: string })
    }));
  }

  onBasicInfoChange(field: string, value: any) {
    if (field.startsWith('customization_')) {
      const option = field.split('_')[1] as 'text' | 'image' | 'file';
      this.basicInfo.customizations[option] = value;
    } else if (field === 'category_id') {
      this.basicInfo[field] = value ? Number(value) : null;
      this.loadAttributes(this.basicInfo.category_id);
    } else if (field === 'name' || field === 'description') {
      // Normalizar entrada: primera letra en mayúsculas, sin espacios al inicio/fin, sin dobles espacios
      const normalizedValue = value
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/^(.)/, (match: string) => match.toUpperCase()); // Tipar match como string
      (this.basicInfo as any)[field] = normalizedValue;
    } else {
      (this.basicInfo as any)[field] = value;
    }
    this.validateStep1();
  }

  validateStep1(): boolean {
    const newErrors: FormErrors = {};
    const allowedCharsRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s+_-]+$/;

    if (!this.basicInfo.name) {
      newErrors['name'] = 'El nombre es obligatorio';
    } else if (!allowedCharsRegex.test(this.basicInfo.name)) {
      newErrors['name'] = 'Solo se permiten letras, números, acentos, ñ, espacios, +, -, y _';
    } else if (this.basicInfo.name.length < 3 || this.basicInfo.name.length > 100) {
      newErrors['name'] = 'El nombre debe tener entre 3 y 100 caracteres';
    }

    if (!this.basicInfo.description) {
      newErrors['description'] = 'La descripción es obligatoria';
    } else if (!allowedCharsRegex.test(this.basicInfo.description)) {
      newErrors['description'] = 'Solo se permiten letras, números, acentos, ñ, espacios, +, -, y _';
    } else if (this.basicInfo.description.length < 10 || this.basicInfo.description.length > 500) {
      newErrors['description'] = 'La descripción debe tener entre 10 y 500 caracteres';
    }

    if (!this.basicInfo.category_id) {
      newErrors['category_id'] = 'Selecciona una categoría';
    }

    if (!this.basicInfo.product_type) {
      newErrors['product_type'] = 'Selecciona un tipo de producto';
    }

    if (['semi_personalizado', 'personalizado'].includes(this.basicInfo.product_type)) {
      const hasCustomization = Object.values(this.basicInfo.customizations).some(val => val);
      if (!hasCustomization) {
        newErrors['customizations'] = 'Selecciona al menos una opción de personalización';
      }
    }

    this.errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  goToNextStep() {
    if (this.validateStep1()) {
      this.currentStep = 2;
    }
  }

  goToPreviousStep() {
    this.currentStep = 1;
  }

  generateNewId(): number {
    return Math.max(...this.variants.map(v => v.id), 0) + 1;
  }

  addVariant() {
    this.variants.push({
      id: this.generateNewId(),
      sku: '',
      attributes: Object.keys(this.attributes).reduce((acc, key) => {
        acc[key] = '';
        return acc;
      }, {} as { [key: string]: string }),
      production_cost: null,
      profit_margin: null,
      calculated_price: 0,
      images: []
    });
  }

  removeVariant(id: number) {
    if (this.variants.length > 1) {
      this.variants = this.variants.filter(v => v.id !== id);
    }
  }

  handleVariantChange(id: number, field: string, value: any) {
    this.variants = this.variants.map(v => {
      if (v.id === id) {
        const updatedVariant = { ...v, [field]: field === 'production_cost' || field === 'profit_margin' ? Number(value) || null : value };
        if (field === 'production_cost' || field === 'profit_margin') {
          const cost = updatedVariant.production_cost || 0;
          const margin = updatedVariant.profit_margin || 0;
          updatedVariant.calculated_price = cost * (1 + margin / 100);
        }
        return updatedVariant;
      }
      return v;
    });
  }

  handleAttributeChange(id: number, attributeKey: string, value: string) {
    this.variants = this.variants.map(v => v.id === id ? { ...v, attributes: { ...v.attributes, [attributeKey]: value } } : v);
  }

  handleImageUpload(id: number, event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newImages = Array.from(input.files);
      this.variants = this.variants.map(v => {
        if (v.id === id) {
          return { ...v, images: [...v.images, ...newImages].slice(0, 10) };
        }
        return v;
      });
    }
  }

  removeImage(variantId: number, index: number) {
    this.variants = this.variants.map(v => {
      if (v.id === variantId) {
        const newImages = [...v.images];
        newImages.splice(index, 1);
        return { ...v, images: newImages };
      }
      return v;
    });
  }

  validateStep2(): boolean {
    const skus = new Set<string>();
    return this.variants.every(v => {
      if (!v.sku.trim() || skus.has(v.sku)) return false;
      skus.add(v.sku);
      if (v.production_cost === null || v.profit_margin === null) return false;
      if (v.images.length === 0) return false;
      return Object.values(v.attributes).every(attr => attr !== '');
    });
  }

  saveProduct() {
    if (!this.validateStep2()) {
      window.alert('Por favor completa todos los campos requeridos en las variantes');
      return;
    }

    const customizations = Object.entries(this.basicInfo.customizations)
      .filter(([_, enabled]) => enabled)
      .map(([type]) => ({ type: type.charAt(0).toUpperCase() + type.slice(1) as 'Texto' | 'Imagen' | 'Archivo', description: '' }));

    const productData: NewProduct = {
      name: this.basicInfo.name,
      description: this.basicInfo.description,
      product_type: this.basicInfo.product_type as 'Existencia' | 'semi_personalizado' | 'personalizado',
      category_id: this.basicInfo.category_id!,
      collaborator_id: this.basicInfo.collaborator_id || undefined,
      variants: this.variants.map(v => ({
        sku: v.sku,
        production_cost: v.production_cost!,
        profit_margin: v.profit_margin!,
        stock: 0,
        attributes: Object.entries(v.attributes).map(([key, value]) => ({
          attribute_id: this.attributes[key].attribute_id,
          value
        })),
        images: v.images
      })),
      customizations: customizations.length > 0 ? customizations : undefined
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

  getAttributeKeys(): string[] {
    return Object.keys(this.attributes);
  }
}