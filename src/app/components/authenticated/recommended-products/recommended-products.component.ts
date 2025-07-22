import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { RecommendationService, RecommendationResponse, Recommendation } from '../../services/recommendation.service';

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
  currentIndex: number = 0;
  itemsPerView: number = 3;
  isPaused: boolean = false;
  private destroy$ = new Subject<void>();
  private autoPlayInterval: any;

  constructor(
    private authService: AuthService,
    private recommendationService: RecommendationService,
    private router: Router
  ) {
    this.updateItemsPerView();
  }

  @HostListener('window:resize')
  updateItemsPerView() {
    const width = window.innerWidth;
    if (width < 640) {
      this.itemsPerView = 1; // Mobile
    } else if (width < 1024) {
      this.itemsPerView = 2; // Tablet
    } else {
      this.itemsPerView = 3; // Desktop
    }
    // Reset currentIndex to prevent out-of-bounds issues
    if (this.recommendations && this.currentIndex > this.maxIndex) {
      this.currentIndex = this.maxIndex;
    }
  }

  ngOnInit() {
    this.authService.getUser().pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.isAuthenticated = !!user;
      if (this.isAuthenticated) {
        this.loadRecommendations();
        this.startPolling();
        this.startAutoPlay();
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
        min_price: 200.0,
        max_price: 200.0,
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
        urgent_delivery_cost: 100.0,
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
        min_price: 300.0,
        max_price: 400.0,
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

  private startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      if (!this.isPaused && this.recommendations && this.recommendations.data.recommendations.length > this.itemsPerView) {
        this.nextSlide();
      }
    }, 3000);
  }

  private stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  nextSlide() {
    if (this.recommendations && this.recommendations.data.recommendations.length > this.itemsPerView) {
      this.currentIndex = (this.currentIndex >= this.maxIndex) ? 0 : this.currentIndex + 1;
    }
  }

  prevSlide() {
    if (this.recommendations && this.recommendations.data.recommendations.length > this.itemsPerView) {
      this.currentIndex = (this.currentIndex <= 0) ? this.maxIndex : this.currentIndex - 1;
    }
  }

  goToSlide(index: number) {
    if (this.recommendations && this.recommendations.data.recommendations.length > this.itemsPerView) {
      this.currentIndex = Math.min(index, this.maxIndex);
    }
  }

  get maxIndex(): number {
    return this.recommendations ? Math.max(0, this.recommendations.data.recommendations.length - this.itemsPerView) : 0;
  }

  get visibleItemsCount(): number {
    return this.recommendations && this.recommendations.data.recommendations.length > 0
      ? Math.min(this.itemsPerView, this.recommendations.data.recommendations.length - this.currentIndex)
      : 0;
  }

  handleMouseEnter() {
    this.isPaused = true;
  }

  handleMouseLeave() {
    this.isPaused = false;
  }

  ngOnDestroy() {
    this.stopAutoPlay();
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
      return `$${minPrice.toFixed(2)} MXN`;
    }
    return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)} MXN`;
  }

  goToProductDetail(productId: number | null): void {
    if (productId != null && productId > 0) {
      this.router.navigate([`/collection/${productId}`]);
    } else {
      console.warn('Product ID is invalid, cannot navigate:', productId);
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