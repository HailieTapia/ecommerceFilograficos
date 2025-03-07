import { Component, EventEmitter, Input, Output, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService, NewProduct, CreatedProductResponse, UpdateProductResponse, DetailedProductResponse, Variant, DetailedVariant } from '../../../services/product.service';
import { ModalComponent } from '../../../../modal/modal.component';
import { ProductGeneralInfoComponent } from './product-general-info/product-general-info.component';
import { ProductVariantsComponent } from './product-variants/product-variants.component';
import { ProductAttributeService } from '../../../services/product-attribute.service';

@Component({
  selector: 'app-product-catalog-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ProductGeneralInfoComponent, ProductVariantsComponent],
  templateUrl: './product-catalog-form.component.html',
  styleUrls: ['./product-catalog-form.component.css']
})
export class ProductCatalogFormComponent implements AfterViewInit, OnDestroy {
  @ViewChild('modal') modal!: ModalComponent;
  @Input() productId: number | null = null;
  @Output() productSaved = new EventEmitter<void>();

  currentStep = 1;
  totalSteps = 2;
  generalInfoData: Partial<NewProduct> = {};
  variantsData: Variant[] = [];
  detailedVariants: DetailedVariant[] = [];
  isLoading = false;
  attributesLoaded = false;
  private subscriptions = new Subscription();

  constructor(
    private productService: ProductService,
    private productAttributeService: ProductAttributeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    if (!this.modal) {
      throw new Error('El modal no está inicializado correctamente.');
    }
    this.preloadAttributes();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  preloadAttributes(): void {
    this.isLoading = true;
    this.cdr.detectChanges(); // Necesario para mostrar el spinner inmediatamente
    const sub = this.productAttributeService.getAttributesByActiveCategories().subscribe({
      next: () => {
        this.attributesLoaded = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al precargar atributos:', err);
        alert('No se pudieron cargar los atributos. Intenta de nuevo.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  openModal(): void {
    this.resetForm();
    this.currentStep = 1;
    if (this.productId !== null) {
      this.loadProductData(this.productId);
    }
    this.modal.open();
  }

  private resetForm(): void {
    this.generalInfoData = {};
    this.variantsData = [];
    this.detailedVariants = [];
    this.isLoading = false;
  }

  private loadProductData(productId: number): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    const sub = this.productService.getProductById(productId).subscribe({
      next: (response: DetailedProductResponse) => {
        const product = response.product;
        this.generalInfoData = {
          name: product.name,
          description: product.description ?? undefined,
          product_type: product.product_type,
          category_id: product.category?.category_id ?? undefined,
          collaborator_id: product.collaborator?.collaborator_id ?? undefined,
          customizations: product.customizations
        };
        this.detailedVariants = product.variants;
        this.variantsData = product.variants.map(v => ({
          sku: v.sku,
          production_cost: v.production_cost,
          profit_margin: v.profit_margin,
          stock: v.stock,
          stock_threshold: v.stock_threshold,
          attributes: v.attributes.map(a => ({ attribute_id: a.attribute_id, value: a.value })),
          images: []
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar los datos del producto:', err);
        alert('No se pudo cargar el producto para edición.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.subscriptions.add(sub);
  }

  onGeneralInfoChange(data: Partial<NewProduct>): void {
    this.generalInfoData = { ...this.generalInfoData, ...data, category_id: Number(data.category_id) };
    // Eliminamos detectChanges aquí para evitar ciclos infinitos
  }

  onVariantsChange(data: Variant[]): void {
    this.variantsData = [...data];
    // Eliminamos detectChanges aquí
  }

  nextStep(): void {
    if (this.currentStep === 1 && !this.isGeneralInfoValid()) {
      alert('Por favor, completa todos los campos requeridos en Información General.');
      return;
    }
    if (!this.attributesLoaded) {
      alert('Esperando a que se carguen los atributos. Intenta de nuevo en un momento.');
      return;
    }
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isGeneralInfoValid(): boolean {
    return !!(
      this.generalInfoData.name &&
      this.generalInfoData.product_type &&
      this.generalInfoData.category_id &&
      (this.generalInfoData.product_type === 'Existencia' ||
       (this.generalInfoData.customizations && this.generalInfoData.customizations.length > 0))
    );
  }

  get progressWidth(): string {
    return this.currentStep === 1 ? '50%' : '100%';
  }

  get isSaveDisabled(): boolean {
    return this.isLoading || 
           this.variantsData.length === 0 || 
           this.variantsData.some((v, i) => {
             const hasExistingImages = this.detailedVariants[i]?.images?.length > 0;
             return !v.sku || 
                    v.production_cost <= 0 || 
                    v.profit_margin <= 0 || 
                    (!v.images?.length && !hasExistingImages) || 
                    (v.attributes?.some(attr => !attr.value) ?? false);
           });
  }

  get hasVariantsWithoutImages(): boolean {
    return this.variantsData.length > 0 && 
           this.variantsData.some((v, i) => !v.images?.length && !this.detailedVariants[i]?.images?.length);
  }

  saveProduct(): void {
    if (!this.isGeneralInfoValid() || this.variantsData.length === 0 || this.isSaveDisabled) {
      alert('Por favor, completa todos los campos requeridos.');
      return;
    }

    const productData: NewProduct = {
      name: this.generalInfoData.name as string,
      description: this.generalInfoData.description,
      product_type: this.generalInfoData.product_type as 'Existencia' | 'semi_personalizado' | 'personalizado',
      category_id: this.generalInfoData.category_id as number,
      collaborator_id: this.generalInfoData.collaborator_id,
      customizations: this.generalInfoData.customizations,
      variants: this.variantsData
    };

    const saveConfirmationMessage = this.productId ? '¿Estás seguro de que deseas actualizar este producto?' : '¿Estás seguro de que deseas crear este producto?';
    if (!confirm(saveConfirmationMessage)) {
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    const save$ = this.productId
      ? this.productService.updateProduct(this.productId, productData)
      : this.productService.createProduct(productData);

    this.subscriptions.add(save$.subscribe({
      next: (response: CreatedProductResponse | UpdateProductResponse) => {
        alert(this.productId ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
        this.productSaved.emit();
        this.modal.close();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al guardar producto:', err);
        alert(`Error al guardar el producto: ${err.error?.message || 'Desconocido'}`);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }));
  }
}