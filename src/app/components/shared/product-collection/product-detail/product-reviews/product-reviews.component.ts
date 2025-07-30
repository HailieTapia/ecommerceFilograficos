import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { ReviewService, ReviewsResponse, Review } from '../../../../../services/review.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpinnerComponent } from '../../../../reusable/spinner/spinner.component';
import { ToastService } from '../../../../../services/toastService';
import { ReviewImageModalComponent } from '../review-image-modal/review-image-modal.component';

@Component({
  selector: 'app-product-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent, ReviewImageModalComponent],
  templateUrl: './product-reviews.component.html',
  styleUrls: ['./product-reviews.component.css']
})
export class ProductReviewsComponent implements OnInit {
  @Input() productId!: number;
  reviews: Review[] = [];
  page: number = 1;
  pageSize: number = 10;
  totalReviews: number = 0;
  isLoading: boolean = false;
  hasMoreReviews: boolean = false;
  filters = {
    withPhotos: false,
    withComments: false,
    sort: 'created_at' as const,
    order: 'DESC' as const
  };
  currentCarouselIndex: number = 0;
  reviewsWithPhotos: Review[] = [];
  selectedReview: Review | null = null;
  showModal: boolean = false;
  selectedMediaIndex: number = 0;
  visibleItems: number = 3; // Number of items to show at once (adjustable based on screen size)

  constructor(
    private reviewService: ReviewService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.productId || isNaN(this.productId) || this.productId <= 0) {
      console.error('Invalid productId:', this.productId);
      this.toastService.showToast('ID de producto inválido', 'error');
      return;
    }
    this.loadReviews();
  }

  loadReviews(): void {
    this.isLoading = true;
    this.reviewService.getReviewsByProduct(this.productId, this.page, this.pageSize, this.filters).subscribe({
      next: (response: ReviewsResponse) => {
        this.reviews = response.reviews || [];
        this.totalReviews = response.total || 0;
        this.hasMoreReviews = this.page * this.pageSize < this.totalReviews;
        this.reviewsWithPhotos = this.reviews.filter(review => review.media && review.media.length > 0);
        this.isLoading = false;
        if (this.reviews.length === 0 && this.totalReviews > 0) {
          this.toastService.showToast('No se encontraron reseñas con los filtros aplicados', 'warning');
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching reviews:', error);
        this.isLoading = false;
        this.reviews = [];
        this.totalReviews = 0;
        this.hasMoreReviews = false;
        this.reviewsWithPhotos = [];
        this.toastService.showToast(error.message || 'Error al cargar las reseñas', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  loadMore(): void {
    this.page++;
    this.reviewService.getReviewsByProduct(this.productId, this.page, this.pageSize, this.filters).subscribe({
      next: (response: ReviewsResponse) => {
        this.reviews = [...this.reviews, ...(response.reviews || [])];
        this.totalReviews = response.total || 0;
        this.hasMoreReviews = this.page * this.pageSize < this.totalReviews;
        this.reviewsWithPhotos = this.reviews.filter(review => review.media && review.media.length > 0);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.toastService.showToast(error.message || 'Error al cargar más reseñas', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.reviews = [];
    this.loadReviews();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  prevPhoto(): void {
    if (this.currentCarouselIndex > 0) {
      this.currentCarouselIndex--;
      this.cdr.detectChanges();
    }
  }

  nextPhoto(): void {
    if (this.currentCarouselIndex < this.reviewsWithPhotos.length - this.visibleItems) {
      this.currentCarouselIndex++;
      this.cdr.detectChanges();
    }
  }

  openModal(review: Review, mediaIndex: number = 0) {
    this.selectedReview = review;
    this.selectedMediaIndex = mediaIndex;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.selectedReview = null;
    this.selectedMediaIndex = 0;
    this.cdr.detectChanges();
  }
}