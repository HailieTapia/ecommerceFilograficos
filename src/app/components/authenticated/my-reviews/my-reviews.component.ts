import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReviewService, ReviewsResponse, PendingReviewsResponse, Review, PendingReview } from '../../services/review.service';
import { ToastService } from '../../services/toastService';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';
import { forkJoin } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

// Registrar los datos de localización para español
registerLocaleData(localeEs);

@Component({
  selector: 'app-my-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SpinnerComponent],
  templateUrl: './my-reviews.component.html',
  styleUrls: ['./my-reviews.component.css'],
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MyReviewsComponent implements OnInit {
  activeTab: 'pending' | 'completed' = 'pending';
  pendingReviews: PendingReviewsResponse = { pendingReviews: [], total: 0, page: 1, pageSize: 10 };
  completedReviews: ReviewsResponse = { reviews: [], total: 0, page: 1, pageSize: 10 };
  isLoadingPending: boolean = false;
  isLoadingCompleted: boolean = false;

  constructor(
    private reviewService: ReviewService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    console.log('MyReviewsComponent initialized');
    // Set initial tab from query params without subscribing to changes
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      this.activeTab = (tab === 'completed' || tab === 'pending') ? tab : 'pending';
      console.log('Active tab set to:', this.activeTab);
    });
    // Load all reviews once on init
    this.loadAllReviews();
  }

  switchTab(tab: 'pending' | 'completed'): void {
    this.activeTab = tab;
    console.log('Switching to tab:', tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
    // No data reload needed; data is already cached
  }

  loadAllReviews(): void {
    this.isLoadingPending = true;
    this.isLoadingCompleted = true;

    forkJoin({
      pending: this.reviewService.getPendingReviews(this.pendingReviews.page, this.pendingReviews.pageSize).pipe(
        retry(2),
        catchError(error => {
          this.handleError(error, 'pendientes');
          return [];
        })
      ),
      completed: this.reviewService.getUserReviews(this.completedReviews.page, this.completedReviews.pageSize).pipe(
        retry(2),
        catchError(error => {
          this.handleError(error, 'realizadas');
          return [];
        })
      )
    }).subscribe({
      next: ({ pending, completed }) => {
        // Handle pending reviews
        this.pendingReviews = {
          pendingReviews: Array.isArray(pending.pendingReviews) ? pending.pendingReviews : [],
          total: pending.total ?? 0,
          page: pending.page ?? 1,
          pageSize: pending.pageSize ?? 10
        };
        this.isLoadingPending = false;
        if (this.pendingReviews.pendingReviews.length === 0 && this.pendingReviews.page === 1) {
          this.toastService.showToast('No tienes reseñas pendientes.', 'info');
        }

        // Handle completed reviews
        this.completedReviews = {
          reviews: Array.isArray(completed.reviews) ? completed.reviews : [],
          total: completed.total ?? 0,
          page: completed.page ?? 1,
          pageSize: completed.pageSize ?? 10
        };
        this.isLoadingCompleted = false;
        if (this.completedReviews.reviews.length === 0 && this.completedReviews.page === 1) {
          this.toastService.showToast('No has realizado ninguna reseña.', 'info');
        }

        console.log('Pending reviews:', this.pendingReviews);
        console.log('Completed reviews:', this.completedReviews);
      },
      error: () => {
        this.isLoadingPending = false;
        this.isLoadingCompleted = false;
        this.toastService.showToast('Error al cargar las reseñas.', 'error');
      }
    });
  }

  private handleError(error: any, type: string): void {
    console.error(`Error fetching ${type} reviews:`, error);
    this.toastService.showToast(error.message || `Error al cargar las reseñas ${type}.`, 'error');
    if (type === 'pendientes') {
      this.pendingReviews = { pendingReviews: [], total: 0, page: 1, pageSize: 10 };
    } else {
      this.completedReviews = { reviews: [], total: 0, page: 1, pageSize: 10 };
    }
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      if (this.activeTab === 'pending') {
        this.pendingReviews.page = page;
        this.loadPendingReviews();
      } else {
        this.completedReviews.page = page;
        this.loadCompletedReviews();
      }
      console.log('Changing page to:', page);
    }
  }

  private loadPendingReviews(): void {
    this.isLoadingPending = true;
    this.reviewService.getPendingReviews(this.pendingReviews.page, this.pendingReviews.pageSize).pipe(
      retry(2),
      catchError(error => {
        this.handleError(error, 'pendientes');
        return [];
      })
    ).subscribe({
      next: (response: PendingReviewsResponse) => {
        this.pendingReviews = {
          pendingReviews: Array.isArray(response.pendingReviews) ? response.pendingReviews : [],
          total: response.total ?? 0,
          page: response.page ?? 1,
          pageSize: response.pageSize ?? 10
        };
        this.isLoadingPending = false;
        if (this.pendingReviews.pendingReviews.length === 0 && this.pendingReviews.page === 1) {
          this.toastService.showToast('No tienes reseñas pendientes.', 'info');
        }
      }
    });
  }

  private loadCompletedReviews(): void {
    this.isLoadingCompleted = true;
    this.reviewService.getUserReviews(this.completedReviews.page, this.completedReviews.pageSize).pipe(
      retry(2),
      catchError(error => {
        this.handleError(error, 'realizadas');
        return [];
      })
    ).subscribe({
      next: (response: ReviewsResponse) => {
        this.completedReviews = {
          reviews: Array.isArray(response.reviews) ? response.reviews : [],
          total: response.total ?? 0,
          page: response.page ?? 1,
          pageSize: response.pageSize ?? 10
        };
        this.isLoadingCompleted = false;
        if (this.completedReviews.reviews.length === 0 && this.completedReviews.page === 1) {
          this.toastService.showToast('No has realizado ninguna reseña.', 'info');
        }
      }
    });
  }

  // Optional: Add a method to refresh data manually
  refreshReviews(): void {
    this.loadAllReviews();
  }

  getTotalPages(): number {
    const totalPages = this.activeTab === 'pending'
      ? Math.ceil(this.pendingReviews.total / this.pendingReviews.pageSize)
      : Math.ceil(this.completedReviews.total / this.completedReviews.pageSize);
    console.log('Total pages:', totalPages);
    return totalPages;
  }

  getFormattedDate(date: string | null | undefined): string {
    return date ? this.datePipe.transform(date, "d 'de' MMMM 'de' yyyy", undefined, 'es') || 'Fecha no disponible' : 'Fecha no disponible';
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
    return '★'.repeat(Math.min(Math.max(rating, 0), 5)) + '☆'.repeat(5 - Math.min(Math.max(rating, 0), 5));
  }
}