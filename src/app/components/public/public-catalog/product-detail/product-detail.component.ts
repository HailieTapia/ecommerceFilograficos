import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PublicProductService } from '../../../services/PublicProductService';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toastService';
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: any = null;
  selectedVariant: any = null;
  selectedImage: string | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private toastService: ToastService,
    private route: ActivatedRoute,
    private productService: PublicProductService
  ) { }

  ngOnInit() {
    const productId = this.route.snapshot.paramMap.get('productId');
    if (productId) {
      this.loadProductDetails(+productId);
    }
  }

  loadProductDetails(productId: number) {
    this.isLoading = true;
    this.error = null;
    this.productService.getProductById(productId).subscribe(response => {
      this.product = response.product;
      // Seleccionar la primera variante por defecto
      if (this.product.variants && this.product.variants.length > 0) {
        this.selectVariant(this.product.variants[0]);
      }
      this.isLoading = false;
    }, error => {
      const errorMessage = error?.error?.message || 'Error al cargar detalles del producto';
      this.toastService.showToast(errorMessage, 'error');
      this.isLoading = false;
    });
  }

  selectVariant(variant: any) {
    this.selectedVariant = variant;
    // Establecer la primera imagen de la variante seleccionada
    if (variant.images && variant.images.length > 0) {
      this.selectedImage = variant.images[0].image_url;
    } else {
      this.selectedImage = null;
    }
  }

  changeImage(imageUrl: string) {
    this.selectedImage = imageUrl;
  }

  formatPrice(price: string | number): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? 'N/A' : numPrice.toFixed(2);
  }
}