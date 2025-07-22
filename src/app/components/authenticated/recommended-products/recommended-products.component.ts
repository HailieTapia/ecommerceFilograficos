import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { RecommendationService, RecommendationResponse, Recommendation } from '../../services/recommendation.service';
import { CartService, AddToCartRequest } from '../../services/cart.service';

@Component({
  selector: 'app-recommended-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recommended-products.component.html',
  styleUrls: ['./recommended-products.component.css']
})
export class RecommendedProductsComponent implements OnInit, OnDestroy {
  recommendations: RecommendationResponse | null = null;
  errorMessage: string | null = null;
  isAuthenticated: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private recommendationService: RecommendationService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.getUser().pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.isAuthenticated = !!user;
      if (this.isAuthenticated) {
        this.loadRecommendations();
        this.startPolling();
      } else {
        this.recommendations = {
          message: 'Usuario no autenticado',
          error: 'Por favor, inicia sesión para ver las recomendaciones.',
          data: { user_id: null, cluster: null, recommendations: [] }
        };
        this.errorMessage = 'Por favor, inicia sesión para ver las recomendaciones.';
      }
    });
  }

  public loadRecommendations() {
    this.recommendationService.getRecommendations(false).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: RecommendationResponse) => {
        this.recommendations = response;
        this.errorMessage = response.error && response.data.recommendations.length === 0 ? response.message : null;
        console.log('Recomendaciones:', response);
        if (response.data.recommendations.length === 0 && response.error) {
          this.loadDefaultRecommendations();
        }
      },
      error: (error) => {
        console.error('Error en loadRecommendations:', error);
        this.errorMessage = 'No se pudieron cargar las recomendaciones en este momento.';
        this.recommendations = {
          message: 'Error al cargar recomendaciones',
          error: 'Recomendaciones no disponibles, intenta de nuevo más tarde',
          data: { user_id: null, cluster: null, recommendations: [] }
        };
        this.loadDefaultRecommendations();
      }
    });
  }

  private startPolling() {
    this.recommendationService.getRecommendations(true).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: RecommendationResponse) => {
        this.recommendations = response;
        this.errorMessage = response.error && response.data.recommendations.length === 0 ? response.message : null;
        console.log('Polling de recomendaciones:', response);
        if (response.data.recommendations.length === 0 && response.error) {
          this.loadDefaultRecommendations();
        }
      },
      error: (error) => {
        console.error('Error en polling:', error);
        this.errorMessage = 'No se pudieron actualizar las recomendaciones en este momento.';
        this.stopPolling();
      }
    });
  }

  private stopPolling() {
    this.destroy$.next();
  }

  private loadDefaultRecommendations() {
    const defaultRecommendations: Recommendation[] = [
      {
        product_id: 1,
        name: 'Producto Popular 1',
        description: 'Un producto popular para todos los usuarios',
        product_type: 'Existencia' as 'Existencia',
        average_rating: '4.5',
        total_reviews: 100,
        min_price: 10.0,
        max_price: 10.0,
        total_stock: 50,
        variant_count: 1,
        category: 'General',
        image_url: 'assets/popular1.jpg',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        collaborator: null,
        standard_delivery_days: 3,
        urgent_delivery_enabled: true,
        urgent_delivery_days: 1,
        urgent_delivery_cost: 5.0,
        confidence: null,
        lift: null
      },
      {
        product_id: 2,
        name: 'Producto Popular 2',
        description: 'Otro producto popular para todos los usuarios',
        product_type: 'Personalizado' as 'Personalizado',
        average_rating: '4.0',
        total_reviews: 80,
        min_price: 15.0,
        max_price: 20.0,
        total_stock: 30,
        variant_count: 2,
        category: 'General',
        image_url: 'assets/popular2.jpg',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        collaborator: null,
        standard_delivery_days: 5,
        urgent_delivery_enabled: false,
        urgent_delivery_days: null,
        urgent_delivery_cost: null,
        confidence: null,
        lift: null
      }
    ];
    this.recommendations = {
      message: 'Mostrando productos populares',
      data: {
        user_id: null,
        cluster: null,
        recommendations: defaultRecommendations
      }
    };
    this.errorMessage = null;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isClient(): boolean {
    let isClient = false;
    this.authService.getUser().pipe(takeUntil(this.destroy$)).subscribe(user => {
      isClient = user && user.tipo === 'cliente';
    });
    return isClient;
  }

  formatPrice(product: any): string {
    const minPrice = parseFloat(product.min_price) || 0;
    const maxPrice = parseFloat(product.max_price) || 0;

    if (minPrice === maxPrice) {
      return `$${minPrice.toFixed(2)}`;
    }
    return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
  }

  goToProductDetail(productId: number | null): void {
    if (productId != null && productId > 0) {
      this.router.navigate([`/collection/${productId}`]);
    } else {
      console.warn('Product ID is invalid, cannot navigate:', productId);
    }
  }

  addToCart(product: Recommendation): void {
    if (product.product_id != null && product.product_id > 0) {
      const cartItem: AddToCartRequest = {
        product_id: product.product_id,
        variant_id: 0, // Valor predeterminado, ajustar según el backend
        quantity: 1,
        is_urgent: product.urgent_delivery_enabled ? true : false
      };
      this.cartService.addToCart(cartItem).subscribe({
        next: (response) => {
          if (response.error) {
            console.warn('Error al añadir al carrito:', response.error);
            // Opcional: Mostrar notificación de error usando ToastService
            // this.toastService.showToast(response.error, 'error');
          } else {
            console.log('Producto añadido al carrito:', product.name);
            // Opcional: Mostrar notificación de éxito
            // this.toastService.showToast(`¡${product.name} añadido al carrito!`, 'success');
            // Recargar el carrito en CartComponent
            this.cartService.loadCart().subscribe({
              next: (cartResponse) => {
                // Actualizar el carrito en CartComponent (manejo implícito vía cartItemCount$)
              }
            });
          }
        },
        error: (error) => {
          console.error('Error al añadir al carrito:', error);
          // Opcional: Mostrar notificación de error
          // this.toastService.showToast('No se pudo añadir al carrito.', 'error');
        }
      });
    } else {
      console.warn('No se puede añadir al carrito, product_id inválido:', product.product_id);
    }
  }

  getStarRating(rating: string | number): { fullStars: number; halfStar: boolean; emptyStars: number } {
    const numericRating = parseFloat(rating as string) || 0;
    const fullStars = Math.floor(numericRating);
    const halfStar = numericRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return { fullStars, halfStar, emptyStars };
  }

  getFormattedRating(rating: string | number): string {
    const numericRating = parseFloat(rating as string) || 0;
    return numericRating.toFixed(1);
  }

  shouldShowRating(product: any): boolean {
    const numericRating = parseFloat(product.average_rating as string) || 0;
    return product.average_rating && numericRating > 0 && product.total_reviews > 0;
  }
}