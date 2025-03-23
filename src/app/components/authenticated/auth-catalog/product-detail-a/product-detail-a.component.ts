import { Component, OnInit } from '@angular/core';
import { AuthProductService } from '../../../services/authProduct.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../services/toastService';
import { ActivatedRoute } from '@angular/router';
import { SpinnerComponent } from '../../../reusable/spinner/spinner.component';
@Component({
  selector: 'app-product-detail-a',
  standalone: true,
  imports: [SpinnerComponent, CommonModule, FormsModule],
  templateUrl: './product-detail-a.component.html',
  styleUrl: './product-detail-a.component.css'
})
export class ProductDetailAComponent implements OnInit {
  product: any = null;
  selectedVariant: any = null;
  selectedImage: string | null = null;
  selectedCustomization: any = null;
  quantity: number = 0;
  isLoading = true;
  isAddingToCart = false;
  showFullDescription = false;
  showFullAttributes = false;
  showFullCustomizations = false;

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
    this.productService.getProductById(productId).subscribe(response => {
      this.product = response.product;
      if (this.product.variants && this.product.variants.length > 0) {
        this.selectVariant(this.product.variants[0]);
      }
      this.isLoading = false;
    }, error => {
      const errorMessage = error?.error?.message || 'No se pudo cargar el producto. Por favor, intenta de nuevo.';
      this.toastService.showToast(errorMessage, 'error');
      this.isLoading = false;
    });
  }

  selectVariant(variant: any) {
    this.selectedVariant = variant;
    if (variant.images && variant.images.length > 0) {
      this.selectedImage = variant.images[0].image_url;
    } else {
      this.selectedImage = null;
    }
    this.quantity = 1;
  }

  changeImage(imageUrl: string) {
    this.selectedImage = imageUrl;
  }

  selectCustomization(customization: any) {
    this.selectedCustomization = customization;
  }

  addToCart() {
    if (!this.selectedVariant) {
      this.toastService.showToast('Por favor, selecciona una variante.', 'info');
      return;
    }

    this.isAddingToCart = true;

    const cartItem = {
      product_id: this.product.product_id,
      variant_id: this.selectedVariant.variant_id,
      quantity: this.quantity,
      customization_option_id: this.selectedCustomization?.option_id || null,
      image: this.selectedVariant?.images[0]?.image_url || this.product.image_url 
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