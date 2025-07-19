import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { ReviewService, ReviewsResponse, Review } from '../../../../services/review.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpinnerComponent } from '../../../../reusable/spinner/spinner.component';
import { ToastService } from '../../../../services/toastService';

@Component({
  selector: 'app-product-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  templateUrl: './product-reviews.component.html',
  styleUrls: ['./product-reviews.component.css']
})
export class ProductReviewsComponent implements OnInit {
  @Input() productId!: number;
  reviews: Review[] = [];
  page = 1;
  pageSize = 10;
  totalReviews = 0;
  isLoading = false;
  hasMoreReviews = false;
  filters = {
    withPhotos: false,
    withComments: false,
    sort: 'created_at' as 'created_at' | 'rating',
    order: 'DESC' as 'ASC' | 'DESC'
  };

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
    console.log('ProductReviewsComponent initialized with productId:', this.productId);
    this.loadReviews();
  }

  loadReviews(): void {
    this.isLoading = true;
    console.log('Fetching reviews with params:', { productId: this.productId, page: this.page, pageSize: this.pageSize, filters: this.filters });
    this.reviewService.getReviewsByProduct(this.productId, this.page, this.pageSize, this.filters).subscribe({
      next: (response: ReviewsResponse) => {
        console.log('Reviews response:', response);
        this.reviews = response.reviews || [];
        this.totalReviews = response.total || 0;
        this.hasMoreReviews = this.page * this.pageSize < this.totalReviews;
        this.isLoading = false;
        if (this.reviews.length === 0 && this.totalReviews > 0) {
          console.warn('No reviews returned, but totalReviews > 0. Check filters or backend response.');
          this.toastService.showToast('No se encontraron reseñas con los filtros aplicados', 'warning');
        }
        console.log('Reviews set:', this.reviews);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching reviews:', error);
        this.isLoading = false;
        this.reviews = [];
        this.totalReviews = 0;
        this.hasMoreReviews = false;
        this.toastService.showToast(error.message || 'Error al cargar las reseñas', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  loadMore(): void {
    this.page++;
    console.log('Loading more reviews, page:', this.page);
    this.reviewService.getReviewsByProduct(this.productId, this.page, this.pageSize, this.filters).subscribe({
      next: (response: ReviewsResponse) => {
        console.log('Load more reviews response:', response);
        this.reviews = [...this.reviews, ...(response.reviews || [])];
        this.totalReviews = response.total || 0;
        this.hasMoreReviews = this.page * this.pageSize < this.totalReviews;
        console.log('Reviews after load more:', this.reviews);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading more reviews:', error);
        this.toastService.showToast(error.message || 'Error al cargar más reseñas', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    console.log('Applying filters:', this.filters);
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
}