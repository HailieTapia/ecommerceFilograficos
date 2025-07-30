import { Component, Input, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RecommendationService, Recommendation, RecommendationResponse, HealthResponse } from '../../services/recommendation.service';

@Component({
  selector: 'app-recommendation',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './recommendation.component.html'
})
export class RecommendationComponent implements OnInit, OnDestroy {
  @Input() set product(value: string) {
    const trimmedValue = value?.trim();
    if (!trimmedValue) {
      this.errorMessage = 'El nombre del producto no puede estar vacío';
      this.recommendations = [];
      this.stopAutoPlay();
      return;
    }
    if (trimmedValue !== this._product) {
      this._product = trimmedValue;
      this.getRecommendations();
    }
  }
  public _product: string = '';
  recommendations: Recommendation[] = [];
  errorMessage: string | null = null;
  isLoading: boolean = false;
  currentIndex: number = 0;
  itemsPerView: number = 3;
  isPaused: boolean = false;
  private destroy$ = new Subject<void>();
  private autoPlayInterval: any;

  constructor(private recommendationService: RecommendationService) {
    this.updateItemsPerView();
  }

  ngOnInit() {
    this.checkHealth();
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
    if (this.recommendations.length > 0 && this.currentIndex > this.maxIndex) {
      this.currentIndex = this.maxIndex;
    }
  }

  checkHealth() {
    this.recommendationService.checkHealth().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: HealthResponse) => {
        if (!response.success || response.data.status !== 'OK') {
          this.errorMessage = 'El servicio de recomendaciones no está disponible';
          console.warn('Health check failed:', response.data);
        }
      },
      error: (error) => {
        this.errorMessage = 'Error al verificar el estado del servicio: ' + (error.message || 'Intenta de nuevo');
        console.error('Health check error:', error);
      }
    });
  }

  getRecommendations() {
    if (!this._product) {
      this.errorMessage = 'Por favor ingresa un producto válido';
      this.recommendations = [];
      this.stopAutoPlay();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.recommendationService.getRecommendations(this._product).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: RecommendationResponse) => {
        this.recommendations = Array.isArray(response.data.recommendations) ? response.data.recommendations : [];
        this.errorMessage = response.success
          ? (this.recommendations.length === 0 ? response.message || 'No hay recomendaciones disponibles.' : null)
          : (response.error || response.message || 'No se pudieron cargar las recomendaciones');
        this.isLoading = false;
        if (this.recommendations.length > this.itemsPerView) {
          this.startAutoPlay();
        } else {
          this.stopAutoPlay();
        }
      },
      error: (error) => {
        this.errorMessage = error.message || 'No se pudieron cargar las recomendaciones: Intenta de nuevo';
        this.recommendations = [];
        this.isLoading = false;
        this.stopAutoPlay();
        console.error('Error fetching recommendations:', error);
      }
    });
  }

  private startAutoPlay() {
    this.stopAutoPlay();
    this.autoPlayInterval = setInterval(() => {
      if (!this.isPaused && this.recommendations.length > this.itemsPerView) {
        this.nextSlide();
      }
    }, 3000);
  }

  private stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  nextSlide() {
    if (this.recommendations.length > this.itemsPerView) {
      this.currentIndex = this.currentIndex >= this.maxIndex ? 0 : this.currentIndex + 1;
    }
  }

  prevSlide() {
    if (this.recommendations.length > this.itemsPerView) {
      this.currentIndex = this.currentIndex <= 0 ? this.maxIndex : this.currentIndex - 1;
    }
  }

  goToSlide(index: number) {
    if (this.recommendations.length > this.itemsPerView) {
      this.currentIndex = Math.min(index, this.maxIndex);
    }
  }

  get maxIndex(): number {
    return Math.max(0, this.recommendations.length - this.itemsPerView);
  }

  get visibleItemsCount(): number {
    return this.recommendations.length > 0 ? Math.min(this.itemsPerView, this.recommendations.length - this.currentIndex) : 0;
  }

  handleMouseEnter() {
    this.isPaused = true;
  }

  handleMouseLeave() {
    this.isPaused = false;
  }

  getStarRating(rating: string): { fullStars: number; halfStar: boolean; emptyStars: number } {
    const numericRating = parseFloat(rating) || 0;
    const fullStars = Math.floor(numericRating);
    const halfStar = numericRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return { fullStars, halfStar, emptyStars };
  }

  getFormattedRating(rating: string): string {
    const numericRating = parseFloat(rating) || 0;
    return numericRating.toFixed(1);
  }

  shouldShowRating(product: Recommendation): boolean {
    const numericRating = parseFloat(product.average_rating) || 0;
    return product.average_rating !== null && numericRating > 0 && product.total_reviews > 0;
  }

  formatPrice(product: Recommendation): string {
    const minPrice = parseFloat(product.min_price as any) || 0;
    const maxPrice = parseFloat(product.max_price as any) || 0;
    if (minPrice === maxPrice) {
      return `$${minPrice.toFixed(2)} MXN`;
    }
    return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)} MXN`;
  }

  goToProductDetail(productId: number): void {
    if (productId > 0) {
      this.currentIndex = 0;
      window.location.href = `/collection/${productId}`;
    } else {
      console.warn('Invalid product ID:', productId);
    }
  }

  ngOnDestroy() {
    this.stopAutoPlay();
    this.destroy$.next();
    this.destroy$.complete();
  }
}