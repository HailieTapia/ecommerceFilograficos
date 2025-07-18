import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReviewService, ReviewsResponse, PendingReviewsResponse, Review, PendingReview } from '../../services/review.service';
import { ToastService } from '../../services/toastService';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';

// Registrar los datos de localización para español
registerLocaleData(localeEs);

@Component({
  selector: 'app-my-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SpinnerComponent, DatePipe],
  templateUrl: './my-reviews.component.html',
  styleUrls: ['./my-reviews.component.css'],
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
})
export class MyReviewsComponent implements OnInit {
  activeTab: 'pending' | 'completed' = 'pending';
  pendingReviews: PendingReviewsResponse = { pendingReviews: [], total: 0, page: 1, pageSize: 10 };
  completedReviews: ReviewsResponse = { reviews: [], total: 0, page: 1, pageSize: 10 };
  isLoading: boolean = false;

  constructor(
    private reviewService: ReviewService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    console.log('MyReviewsComponent initialized');
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      this.activeTab = (tab === 'completed' || tab === 'pending') ? tab : 'pending';
      console.log('Active tab set to:', this.activeTab);
      this.loadReviews();
    });
  }

  switchTab(tab: 'pending' | 'completed'): void {
    this.activeTab = tab;
    console.log('Switching to tab:', tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
    this.loadReviews();
  }

  loadReviews(): void {
    this.isLoading = true;
    console.log('Loading reviews for tab:', this.activeTab);
    if (this.activeTab === 'pending') {
      this.reviewService.getPendingReviews(this.pendingReviews.page, this.pendingReviews.pageSize).subscribe({
        next: (response: PendingReviewsResponse) => {
          console.log('Pending reviews response:', response);
          this.pendingReviews = {
            pendingReviews: Array.isArray(response.pendingReviews) ? response.pendingReviews : [],
            total: response.total ?? 0,
            page: response.page ?? 1,
            pageSize: response.pageSize ?? 10
          };
          console.log('Assigned pendingReviews:', this.pendingReviews);
          this.isLoading = false;
          if (this.pendingReviews.pendingReviews.length === 0 && this.pendingReviews.page === 1) {
            this.toastService.showToast('No tienes reseñas pendientes.', 'info');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error fetching pending reviews:', error);
          this.pendingReviews = { pendingReviews: [], total: 0, page: 1, pageSize: 10 };
          this.toastService.showToast(error.message || 'Error al cargar las reseñas pendientes.', 'error');
        }
      });
    } else {
      this.reviewService.getUserReviews(this.completedReviews.page, this.completedReviews.pageSize).subscribe({
        next: (response: ReviewsResponse) => {
          console.log('Completed reviews response:', response);
          this.completedReviews = {
            reviews: Array.isArray(response.reviews) ? response.reviews : [],
            total: response.total ?? 0,
            page: response.page ?? 1,
            pageSize: response.pageSize ?? 10
          };
          console.log('Assigned completedReviews:', this.completedReviews);
          this.isLoading = false;
          if (this.completedReviews.reviews.length === 0 && this.completedReviews.page === 1) {
            this.toastService.showToast('No has realizado ninguna reseña.', 'info');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error fetching completed reviews:', error);
          this.completedReviews = { reviews: [], total: 0, page: 1, pageSize: 10 };
          this.toastService.showToast(error.message || 'Error al cargar las reseñas realizadas.', 'error');
        }
      });
    }
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      if (this.activeTab === 'pending') {
        this.pendingReviews.page = page;
      } else {
        this.completedReviews.page = page;
      }
      console.log('Changing page to:', page);
      this.loadReviews();
    }
  }

  getTotalPages(): number {
    const totalPages = this.activeTab === 'pending'
      ? Math.ceil(this.pendingReviews.total / this.pendingReviews.pageSize)
      : Math.ceil(this.completedReviews.total / this.completedReviews.pageSize);
    console.log('Total pages:', totalPages);
    return totalPages;
  }

  getFormattedDate(date: string): string {
    return this.datePipe.transform(date, "d 'de' MMMM 'de' yyyy", undefined, 'es') || 'Fecha no disponible';
  }

  navigateToReviewCreation(orderId: number, productId: number): void {
    console.log('Navigating to review creation:', { orderId, productId });
    this.router.navigate(['/review-create'], { queryParams: { orderId, productId } });
  }

  navigateToReviewDetails(reviewId: number): void {
    console.log('Navigating to review details:', reviewId);
    this.router.navigate(['/review', reviewId]);
  }

  trackByReviewId(index: number, item: Review | PendingReview): number {
    return 'review_id' in item ? item.review_id : item.order_id;
  }

  getImageUrl(item: Review | PendingReview): string {
    return item.image_url || 'https://via.placeholder.com/100?text=No+Image';
  }

  getStarRating(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}