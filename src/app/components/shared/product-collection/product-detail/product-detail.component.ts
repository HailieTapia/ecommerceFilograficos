import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductCollectionService, ProductDetail, ProductVariant, Product } from '../../../../services/product-collection.service';
import { AuthService } from '../../../../services/auth.service';
import { CartService, AddToCartRequest, CartItem } from '../../../../services/cart.service';
import { ReviewService, ReviewSummary } from '../../../../services/review.service';
import { ToastService } from '../../../../services/toastService';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpinnerComponent } from '../../../reusable/spinner/spinner.component';
import { ProductReviewsComponent } from './product-reviews/product-reviews.component';
import { takeUntil } from 'rxjs/operators';
import { Subject, forkJoin } from 'rxjs';
import { RecommendationComponent } from '../../recommendation/recommendation.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RecommendationComponent, CommonModule, FormsModule, RouterModule, SpinnerComponent, ProductReviewsComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  product: ProductDetail | null = null;
  reviewSummary: ReviewSummary | null = null;
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
    private reviewService: ReviewService,
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
      this.productService.getAllProducts({ page: 1, pageSize: 4, categoryId: null }, this.isAuthenticated),
      this.reviewService.getReviewsSummaryByProduct(productId)
    ]).subscribe({
      next: ([productResponse, relatedResponse, reviewSummary]) => {
        this.product = productResponse.product;
        this.breadcrumb = productResponse.product.breadcrumb || [];
        this.relatedProducts = relatedResponse.products.filter(p => p.product_id !== productId).slice(0, 4);
        this.reviewSummary = reviewSummary;

        if (this.product.variants && this.product.variants.length > 0) {
          const matchingVariant = this.variantSku
            ? this.product.variants.find(v => v.sku === this.variantSku) || this.product.variants[0]
            : this.product.variants[0];
          this.selectVariant(matchingVariant);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading product details:', error);
        this.isLoading = false;
        let message = error.message || 'No se pudo cargar el producto. Intenta de nuevo más tarde.';

        if (!navigator.onLine) {
          message = 'Estás en modo offline. Algunos datos podrían no estar disponibles.';
        }
        this.toastService.showToast(message, 'error');
        this.router.navigate(['/collection']);
      }
    });
  }

  getRoundedAverageRating(): number {
    return this.reviewSummary ? Math.round(this.reviewSummary.averageRating) : 0;
  }

  getRatingDistributionWidths(): number[] {
    if (!this.reviewSummary || !this.reviewSummary.ratingDistribution) return [0, 0, 0, 0, 0];
    const totalReviews = this.reviewSummary.totalReviews || 1;
    return [5, 4, 3, 2, 1].map(rating =>
      Math.round((this.reviewSummary!.ratingDistribution[rating.toString()] || 0) / totalReviews * 100)
    );
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
      option_id: this.selectedCustomization?.option_id,
      is_urgent: this.isUrgent
    };

    this.cartService.addToCart(cartItem).subscribe({
      next: (response) => {
        this.isAddingToCart = false;
        this.toastService.showToast('Producto añadido al carrito exitosamente', 'success');
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
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      }, 2000);
      return;
    }
    if (!this.selectedVariant || this.selectedVariant.stock === 0) {
      this.toastService.showToast('Producto no disponible o sin stock', 'error');
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

    const buyNowItem: CartItem = {
      cart_detail_id: 0,
      product_id: this.product!.product_id,
      product_name: this.product!.name,
      variant_id: this.selectedVariant.variant_id,
      variant_sku: this.selectedVariant.sku,
      calculated_price: this.selectedVariant.calculated_price,
      quantity: this.quantity,
      unit_price: this.selectedVariant.calculated_price,
      urgent_delivery_fee: this.isUrgent && this.product?.urgent_delivery_enabled ? this.product.urgent_delivery_cost : 0,
      discount_applied: 0,
      subtotal: this.quantity * this.selectedVariant.calculated_price,
      unit_measure: 'unidad',
      category_id: this.product!.category?.category_id || 0,
      is_urgent: this.isUrgent,
      urgent_delivery_cost: this.product?.urgent_delivery_cost || 0,
      urgent_delivery_enabled: this.product?.urgent_delivery_enabled || false,
      standard_delivery_days: this.product!.standard_delivery_days,
      urgent_delivery_days: this.product!.urgent_delivery_days || null,
      customization: this.selectedCustomization ? {
        option_id: this.selectedCustomization.option_id!,
        option_type: this.selectedCustomization.type,
        description: this.selectedCustomization.description
      } : null,
      images: this.selectedVariant.images || [],
      applicable_promotions: []
    };

    this.router.navigate(['/checkout'], {
      state: { buyNowItem }
    });
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