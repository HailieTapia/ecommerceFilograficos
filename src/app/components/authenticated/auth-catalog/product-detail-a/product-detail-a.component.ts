import { Component, OnInit } from '@angular/core';
import { AuthProductService, ProductDetail } from '../../../services/authProduct.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../services/toastService';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SpinnerComponent } from '../../../reusable/spinner/spinner.component';

@Component({
  selector: 'app-product-detail-a',
  standalone: true,
  imports: [SpinnerComponent, CommonModule, FormsModule, RouterModule],
  templateUrl: './product-detail-a.component.html',
  styleUrl: './product-detail-a.component.css'
})
export class ProductDetailAComponent implements OnInit {
  product: ProductDetail | null = null;
  selectedVariant: ProductDetail['variants'][0] | null = null;
  selectedImage: string | null = null;
  selectedCustomization: ProductDetail['customizations'][0] | null = null;
  quantity: number = 1;
  isUrgent: boolean = false; // Nueva propiedad para entrega urgente
  isLoading = true;
  isAddingToCart = false;
  showFullDescription = false;
  showFullAttributes = false;
  showFullCustomizations = false;
  currentImageIndex: number = 0; // Para navegación de imágenes
  breadcrumb: { id: number | null; name: string }[] = [];

  constructor(
    private toastService: ToastService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private productService: AuthProductService
  ) { }

  ngOnInit() {
    const productId = this.route.snapshot.paramMap.get('productIdA');
    if (productId) {
      this.loadProductDetails(+productId);
    }
  }

  loadProductDetails(productId: number) {
    this.isLoading = true;
    this.productService.getProductById(productId).subscribe({
      next: (response) => {
        this.product = response.product;
        const baseCrumbs = [...(response.product.breadcrumb || [])];
        baseCrumbs.push({ id: null, name: response.product.name });
        this.breadcrumb = baseCrumbs;
        if (this.product.variants && this.product.variants.length > 0) {
          this.selectVariant(this.product.variants[0]);
        }
        this.isLoading = false;
      },
      error: (error) => {
        const errorMessage = error?.message || 'No se pudo cargar el producto. Por favor, intenta de nuevo.';
        this.toastService.showToast(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  selectVariant(variant: ProductDetail['variants'][0]) {
    this.selectedVariant = variant;
    this.currentImageIndex = 0;
    if (variant.images && variant.images.length > 0) {
      this.selectedImage = variant.images[0].image_url;
    } else {
      this.selectedImage = null;
    }
    this.quantity = 1;
  }

  changeImage(imageUrl: string) {
    this.selectedImage = imageUrl;
    this.currentImageIndex = this.selectedVariant?.images.findIndex(img => img.image_url === imageUrl) || 0;
  }

  prevImage() {
    if (this.currentImageIndex > 0 && this.selectedVariant?.images) {
      this.currentImageIndex--;
      this.selectedImage = this.selectedVariant.images[this.currentImageIndex].image_url;
    }
  }

  nextImage() {
    if (this.selectedVariant?.images && this.currentImageIndex < this.selectedVariant.images.length - 1) {
      this.currentImageIndex++;
      this.selectedImage = this.selectedVariant.images[this.currentImageIndex].image_url;
    }
  }

  selectCustomization(customization: ProductDetail['customizations'][0]) {
    this.selectedCustomization = customization;
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  addToCart() {
    if (!this.selectedVariant) {
      this.toastService.showToast('Por favor, selecciona una variante.', 'info');
      return;
    }
    if (this.quantity <= 0 || this.quantity > this.selectedVariant.stock) {
      this.toastService.showToast('Cantidad inválida o excede el stock disponible.', 'error');
      return;
    }
    if (this.isUrgent && !this.product?.urgent_delivery_enabled) {
      this.toastService.showToast('Este producto no permite entrega urgente.', 'error');
      return;
    }

    this.isAddingToCart = true;

    const cartItem = {
      product_id: this.product!.product_id,
      variant_id: this.selectedVariant.variant_id,
      quantity: this.quantity,
      customization_option_id: this.selectedCustomization?.option_id || null,
      image: this.selectedVariant.images[0]?.image_url || null,
      is_urgent: this.isUrgent
    };

    this.cartService.addToCart(cartItem).subscribe({
      next: (response) => {
        this.isAddingToCart = false;
        const successMessage = response?.message || 'Producto añadido al carrito exitosamente';
        this.toastService.showToast(successMessage, 'success');
      },
      error: (error) => {
        this.isAddingToCart = false;
        const errorMessage = error?.error?.message || 'No se pudo añadir el producto al carrito.';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }
}