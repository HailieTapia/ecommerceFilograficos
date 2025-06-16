import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicProductService, ProductDetail } from '../../../services/PublicProductService';
import { CartService, AddToCartRequest } from '../../../services/cart.service';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toastService';
import { CollaboratorsService } from '../../../services/collaborators.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: ProductDetail | null = null;
  selectedVariant: any = null;
  selectedImage: string | null = null;
  isLoading = true;
  error: string | null = null;
  showFullDescription = false;
  showFullAttributes = false;
  showFullCustomizations = false;
  currentImageIndex = 0;
  collaborators: any[] = [];
  quantity: number = 1;
  isUrgent: boolean = false;

  constructor(
    private collaboratorService: CollaboratorsService,
    private router: Router,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private productService: PublicProductService,
    private cartService: CartService
  ) { }

  ngOnInit() {
    const productId = this.route.snapshot.paramMap.get('productId');
    if (productId) {
      this.loadProductDetails(+productId);
    }
    this.loadCollaborators();
  }

  loadProductDetails(productId: number) {
    this.isLoading = true;
    this.error = null;
    this.productService.getProductById(productId).subscribe({
      next: (response) => {
        this.product = response.product;
        if (this.product.variants && this.product.variants.length > 0) {
          this.selectVariant(this.product.variants[0]);
        }
        this.isLoading = false;
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Error al cargar detalles del producto';
        this.toastService.showToast(errorMessage, 'error');
        this.error = errorMessage;
        this.isLoading = false;
      }
    });
  }

  selectVariant(variant: any) {
    this.selectedVariant = variant;
    this.currentImageIndex = 0;
    if (variant.images && variant.images.length > 0) {
      this.selectedImage = variant.images[0].image_url;
    } else {
      this.selectedImage = null;
    }
  }

  changeImage(imageUrl: string) {
    this.selectedImage = imageUrl;
    this.currentImageIndex = this.selectedVariant.images.findIndex((img: any) => img.image_url === imageUrl);
  }

  prevImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.selectedImage = this.selectedVariant.images[this.currentImageIndex].image_url;
    }
  }

  nextImage() {
    if (this.currentImageIndex < this.selectedVariant.images.length - 1) {
      this.currentImageIndex++;
      this.selectedImage = this.selectedVariant.images[this.currentImageIndex].image_url;
    }
  }

  formatPrice(price: string | number): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? 'N/A' : numPrice.toFixed(2);
  }

  addToCart() {
    if (!this.selectedVariant || this.quantity <= 0 || this.quantity > this.selectedVariant.stock) {
      this.toastService.showToast('Selecciona una variante válida y una cantidad adecuada', 'error');
      return;
    }

    const request: AddToCartRequest = {
      product_id: this.product!.product_id,
      variant_id: this.selectedVariant.variant_id,
      quantity: this.quantity,
      is_urgent: this.isUrgent
    };

    this.cartService.addToCart(request).subscribe({
      next: (response) => {
        if (response.error) {
          this.toastService.showToast(response.error, 'error');
        } else {
          this.toastService.showToast('Producto añadido al carrito', 'success');
        }
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Error al añadir al carrito';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  requireLogin() {
    this.toastService.showToast('Necesitas iniciar sesión para realizar esta acción', 'warning');
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }

  shareOnWhatsApp() {
    const url = window.location.href;
    const text = `Mira este producto: ${this.product?.name} - ${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }

  copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.toastService.showToast('Enlace copiado al portapapeles', 'success');
    }).catch(() => {
      this.toastService.showToast('Error al copiar el enlace', 'error');
    });
  }

  loadCollaborators() {
    this.collaboratorService.getPublicCollaborators().subscribe({
      next: (response) => {
        this.collaborators = response;
      },
      error: (error) => {
        console.error('Error al cargar los colaboradores:', error);
        this.collaborators = [];
      }
    });
  }
}