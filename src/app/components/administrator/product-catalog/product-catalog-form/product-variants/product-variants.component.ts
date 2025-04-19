import { Component, EventEmitter, Input, Output, OnChanges, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { ProductService, Variant, DetailedVariant } from '../../../../services/product.service';
import { ProductAttributeService, CategoryWithAttributes, Attribute } from '../../../../services/product-attribute.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { debounceTime, Subscription } from 'rxjs';

@Component({
  selector: 'app-product-variants',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-variants.component.html',
  styleUrls: ['./product-variants.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductVariantsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() categoryId: number | undefined = undefined;
  @Input() productName: string = '';
  @Input() initialVariants: Variant[] = [];
  @Input() detailedVariants: DetailedVariant[] = [];
  @Output() variantsData = new EventEmitter<Variant[]>();

  variantsForm: FormGroup;
  allCategoriesWithAttributes: CategoryWithAttributes[] = [];
  attributes: Attribute[] = [];
  imagePreviews: { [key: number]: SafeUrl[] } = {};
  existingImages: { [key: number]: { image_url: string; order: number }[] } = {};
  isLoadingAttributes = false;
  prices: { [key: number]: number } = {};
  private formSubscription: Subscription;

  constructor(
    private fb: FormBuilder,
    private productAttributeService: ProductAttributeService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {
    this.variantsForm = this.fb.group({
      variants: this.fb.array([])
    });

    this.formSubscription = this.variantsForm.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      if (this.variantsForm.valid) {
        this.updatePrices();
        this.emitVariantsData();
      }
    });
  }

  ngOnInit(): void {
    this.loadAllAttributes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryId'] && this.categoryId !== undefined) {
      this.updateAttributesForCategory();
    }

    if (changes['initialVariants']?.currentValue || changes['detailedVariants']?.currentValue) {
      this.patchInitialVariants();
    }
  }

  ngOnDestroy(): void {
    this.formSubscription.unsubscribe();
    // Limpiar URLs de imágenes
    Object.values(this.imagePreviews).forEach(previews => {
      previews.forEach(preview => URL.revokeObjectURL(preview.toString()));
    });
  }

  get variants(): FormArray {
    return this.variantsForm.get('variants') as FormArray;
  }

  private loadAllAttributes(): void {
    this.isLoadingAttributes = true;
    this.productAttributeService.getAttributesByActiveCategories().subscribe({
      next: (data: CategoryWithAttributes[]) => {
        this.allCategoriesWithAttributes = data || [];
        this.updateAttributesForCategory();
        this.isLoadingAttributes = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading attributes:', err);
        this.isLoadingAttributes = false;
        this.cdr.markForCheck();
      }
    });
  }

  private updateAttributesForCategory(): void {
    if (this.categoryId !== undefined) {
      const category = this.allCategoriesWithAttributes.find(c => c.category_id === Number(this.categoryId));
      this.attributes = category?.attributes || [];
      this.initializeVariantsForm();
    }
  }

  private initializeVariantsForm(): void {
    this.variants.clear();
    if (this.initialVariants.length > 0) {
      this.patchInitialVariants();
    } else {
      this.addVariant();
    }
  }

  private patchInitialVariants(): void {
    this.variants.clear();
    this.initialVariants.forEach((variant, index) => {
      const variantGroup = this.createVariantGroup(variant);
      this.variants.push(variantGroup);

      // Manejar imágenes existentes
      const detailedVariant = this.detailedVariants.find(dv => dv.sku === variant.sku);
      this.existingImages[index] = detailedVariant?.images || [];

      // Manejar nuevas imágenes
      if (variant.images?.length) {
        this.imagePreviews[index] = variant.images.map(file =>
          this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file))
        );
      }
    });
    this.cdr.markForCheck();
  }

  private createAttributesGroup(variant: Variant): FormGroup {
    const group: { [key: string]: FormControl } = {};
    this.attributes.forEach(attr => {
      const value = variant.attributes?.find(a => a.attribute_id === attr.attribute_id)?.value || '';
      const validators = attr.is_required ? [Validators.required] : [];
      group[attr.attribute_id.toString()] = this.fb.control(value, validators);
    });
    return this.fb.group(group);
  }

  private getDefaultVariant(): Variant {
    return {
      sku: this.generateDefaultSKU(),
      production_cost: 0,
      profit_margin: 0,
      stock: 0,
      attributes: [],
      images: []
    };
  }

  private generateDefaultSKU(): string {
    const base = this.productName ? this.productName.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() : 'PROD';
    const prefix = (base + 'XXXX').substring(0, 4);
    const timestamp = Date.now().toString().slice(-6);
    const index = (this.variants.length + 1).toString().padStart(2, '0');
    return `${prefix}-${timestamp}-${index}`;
  }

  private createVariantGroup(variant: Variant = this.getDefaultVariant()): FormGroup {
    const attributesGroup = this.createAttributesGroup(variant);

    return this.fb.group({
      sku: [variant.sku || this.generateDefaultSKU(), [Validators.required, Validators.pattern(/^[A-Z]{4}-[0-9]{6}-[0-9]{2}$/), Validators.maxLength(13)]],
      production_cost: [variant.production_cost || 0, [Validators.required, Validators.min(0.01)]],
      profit_margin: [variant.profit_margin || 0, [Validators.required, Validators.min(0.01)]],
      stock: [variant.stock || 0],
      attributes: attributesGroup,
      images: [variant.images || []]
    });
  }

  addVariant(): void {
    if (!this.categoryId) {
      alert('Please select a category first');
      return;
    }

    const newVariant = this.createVariantGroup();
    this.variants.push(newVariant);
    this.imagePreviews[this.variants.length - 1] = [];
    this.existingImages[this.variants.length - 1] = [];
    this.cdr.markForCheck();
  }

  duplicateVariant(index: number): void {
    const variant = this.variants.at(index).value;
    const newVariant = {
      ...variant,
      sku: `${variant.sku}-COPY-${Date.now().toString().slice(-4)}`,
      images: []
    };
    this.variants.insert(index + 1, this.createVariantGroup(newVariant));
    this.imagePreviews[index + 1] = [];
    this.existingImages[index + 1] = [];
    this.cdr.markForCheck();
  }

  removeVariant(index: number): void {
    this.variants.removeAt(index);
    delete this.imagePreviews[index];
    delete this.existingImages[index];
    delete this.prices[index];
    this.cdr.markForCheck();
  }

  onFileChange(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const files = Array.from(input.files);
      const remainingSlots = 10 - (this.variants.at(index).get('images')?.value.length || 0);

      if (files.length > remainingSlots) {
        alert(`You can only upload ${remainingSlots} more images`);
        return;
      }

      const validFiles = files.filter(file =>
        ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      ).slice(0, remainingSlots);

      if (validFiles.length > 0) {
        const currentImages = this.variants.at(index).get('images')?.value || [];
        this.variants.at(index).patchValue({ images: [...currentImages, ...validFiles] });

        validFiles.forEach(file => {
          const url = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));
          this.imagePreviews[index] = [...(this.imagePreviews[index] || []), url];
        });

        this.emitVariantsData();
      }
      input.value = '';
    }
  }

  removeImage(variantIndex: number, imageIndex: number): void {
    const imagesControl = this.variants.at(variantIndex).get('images');
    if (imagesControl) {
      const currentImages = [...imagesControl.value];
      currentImages.splice(imageIndex, 1);
      imagesControl.patchValue(currentImages);

      if (this.imagePreviews[variantIndex]) {
        URL.revokeObjectURL(this.imagePreviews[variantIndex][imageIndex].toString());
        this.imagePreviews[variantIndex].splice(imageIndex, 1);
      }

      this.emitVariantsData();
      this.cdr.markForCheck();
    }
  }

  private updatePrices(): void {
    this.variants.controls.forEach((control, index) => {
      const cost = control.get('production_cost')?.value ?? 0;
      const margin = control.get('profit_margin')?.value ?? 0;
      this.prices[index] = this.calculatePrice(cost, margin);
    });
  }

  private calculatePrice(cost: number, margin: number): number {
    return cost * (1 + margin / 100);
  }

  getPrice(index: number): string {
    return (this.prices[index] || 0).toFixed(2);
  }

  private emitVariantsData(): void {
    if (this.variantsForm.invalid) return;

    const variantsValue = this.variants.controls.map((control, index) => {
      const formGroup = control as FormGroup;
      return {
        sku: formGroup.get('sku')?.value?.trim(),
        production_cost: Number(formGroup.get('production_cost')?.value),
        profit_margin: Number(formGroup.get('profit_margin')?.value),
        stock: Number(formGroup.get('stock')?.value),
        attributes: this.mapAttributes(formGroup.get('attributes')?.value),
        images: formGroup.get('images')?.value
      } as Variant;
    });

    this.variantsData.emit(variantsValue);
  }

  private mapAttributes(attributes: any): { attribute_id: number; value: string }[] {
    return Object.entries(attributes)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({
        attribute_id: Number(key),
        value: String(value)
      }));
  }

  getAttributeOptions(attr: Attribute): string[] {
    return attr.allowed_values?.split(',').map(v => v.trim()) || [];
  }

  getInputType(attr: Attribute): string {
    switch (attr.data_type) {
      case 'texto': return 'text';
      case 'numero': return 'number';
      case 'lista':
      default: return 'select';
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackById(index: number, item: Attribute): number {
    return item.attribute_id;
  }
}