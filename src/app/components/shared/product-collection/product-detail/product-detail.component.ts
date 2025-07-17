import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductCollectionService, ProductDetail, ProductVariant, Product } from '../../../services/product-collection.service';
import { AuthService } from '../../../services/auth.service';
import { CartService, AddToCartRequest } from '../../../services/cart.service';
import { ToastService } from '../../../services/toastService';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpinnerComponent } from '../../../reusable/spinner/spinner.component';
import { takeUntil } from 'rxjs/operators';
import { Subject, forkJoin } from 'rxjs';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  product: ProductDetail | null = null;
  relatedProducts: Product[] = [];
  selectedVariant: ProductVariant | null = null;
  selectedImage: string | null = null;
  selectedCustomization: ProductDetail['customizations'][0] | null = null;
  quantity: number = 1;
  isUrgent: boolean = false;
  isLoading = true;
  isAddingToCart = false;
  activeTab: 'description' | 'additional' = 'description';
  currentImageIndex = 0;
  isAuthenticated = false;
  userRole: string | null = null;
  breadcrumb: { id: number | null; name: string }[] = [];
  variantSku: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductCollectionService,
    private authService: AuthService,
    private cartService: CartService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.authService.getUser().pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.isAuthenticated = !!user;
      this.userRole = user ? user.tipo : null;

      if (this.userRole === 'administrador') {
        this.router.navigate(['/product-catalog']);
        return;
      }

      const productId = this.route.snapshot.paramMap.get('productId');
      this.variantSku = this.route.snapshot.queryParamMap.get('variant_sku');
      
      if (productId && !isNaN(+productId)) {
        this.loadProductDetails(+productId);
      } else {
        this.toastService.showToast('ID de producto inválido', 'error');
        this.router.navigate(['/collection']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProductDetails(productId: number): void {
    this.isLoading = true;
    forkJoin([
      this.productService.getProductById(productId, this.isAuthenticated),
      this.productService.getAllProducts({ page: 1, pageSize: 4, categoryId: null }, this.isAuthenticated)
    ]).subscribe({
      next: ([productResponse, relatedResponse]) => {
        this.product = productResponse.product;
        this.breadcrumb = productResponse.product.breadcrumb || [];
        this.relatedProducts = relatedResponse.products.filter(p => p.product_id !== productId).slice(0, 4);
        
        if (this.product.variants && this.product.variants.length > 0) {
          // Try to find variant matching variantSku, otherwise default to first variant
          const matchingVariant = this.variantSku 
            ? this.product.variants.find(v => v.sku === this.variantSku) || this.product.variants[0]
            : this.product.variants[0];
          this.selectVariant(matchingVariant);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.showToast(error.message, 'error');
        this.isLoading = false;
        this.router.navigate(['/collection']);
      }
    });
  }

  selectVariant(variant: ProductVariant): void {
    this.selectedVariant = variant;
    this.currentImageIndex = 0;
    this.selectedImage = variant.images && variant.images.length > 0 ? variant.images[0].image_url : null;
    this.quantity = 1;
    this.selectedCustomization = null;
  }

  changeImage(imageUrl: string): void {
    this.selectedImage = imageUrl;
    this.currentImageIndex = this.selectedVariant?.images?.findIndex(img => img.image_url === imageUrl) || 0;
  }

  prevImage(): void {
    if (this.currentImageIndex > 0 && this.selectedVariant?.images) {
      this.currentImageIndex--;
      this.selectedImage = this.selectedVariant.images[this.currentImageIndex].image_url;
    }
  }

  nextImage(): void {
    if (this.selectedVariant?.images && this.currentImageIndex < (this.selectedVariant.images.length - 1)) {
      this.currentImageIndex++;
      this.selectedImage = this.selectedVariant.images[this.currentImageIndex].image_url;
    }
  }

  selectCustomization(customization: ProductDetail['customizations'][0] | null): void {
    this.selectedCustomization = customization;
  }

  setActiveTab(tab: 'description' | 'additional'): void {
    this.activeTab = tab;
  }

  formatPrice(price: number | string): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? 'N/A' : numPrice.toFixed(2);
  }

  incrementQuantity(): void {
    if (this.selectedVariant && this.quantity < this.selectedVariant.stock) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.isAuthenticated || this.userRole !== 'cliente') {
      this.toastService.showToast('Necesitas iniciar sesión para añadir al carrito', 'warning');
      setTimeout(() => {
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      }, 2000);
      return;
    }

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
    const cartItem: AddToCartRequest = {
      product_id: this.product!.product_id,
      variant_id: this.selectedVariant.variant_id,
      quantity: this.quantity,
      option_id: this.selectedCustomization?.option_id || undefined,
      is_urgent: this.isUrgent
    };

    this.cartService.addToCart(cartItem).subscribe({
      next: (response) => {
        this.isAddingToCart = false;
        if (response.error) {
          this.toastService.showToast(response.error, 'error');
        } else {
          this.toastService.showToast('Producto añadido al carrito exitosamente', 'success');
        }
      },
      error: (error) => {
        this.isAddingToCart = false;
        this.toastService.showToast(error.message || 'No se pudo añadir al carrito', 'error');
      }
    });
  }

  buyNow(): void {
    if (!this.isAuthenticated || this.userRole !== 'cliente') {
      this.toastService.showToast('Necesitas iniciar sesión para comprar', 'warning');
      setTimeout(() => {
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
      }, 2000);
      return;
    }
    this.addToCart();
    if (this.isAuthenticated && this.userRole === 'cliente' && !this.isAddingToCart) {
      this.router.navigate(['/cart']);
    }
  }

  shareOnWhatsApp(): void {
    const url = window.location.href;
    const text = `Mira este producto: ${this.product?.name} - ${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }

  copyLink(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.toastService.showToast('Enlace copiado al portapapeles', 'success');
    }).catch(() => {
      this.toastService.showToast('Error al copiar el enlace', 'error');
    });
  }
}