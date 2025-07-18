import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ReviewService, Review, CreateReviewRequest, UpdateReviewRequest } from '../../services/review.service';
import { ToastService } from '../../services/toastService';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';

// Registrar los datos de localización para español
registerLocaleData(localeEs);

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SpinnerComponent],
  templateUrl: './review.component.html',
  styleUrls: [],
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
})
export class ReviewComponent implements OnInit {
  mode: 'create' | 'edit' = 'create';
  reviewId?: number;
  orderId?: number;
  productId?: number;
  rating: number = 0;
  comment: string = '';
  files: File[] = [];
  existingMedia: Review['media'] = [];
  mediaToDelete: number[] = [];
  isLoading: boolean = false;
  productName: string = '';
  productImageUrl: string | null = null;
  hoverRating: number = 0;

  constructor(
    private reviewService: ReviewService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const reviewId = params.get('reviewId');
      this.reviewId = reviewId ? +reviewId : undefined;
      this.mode = this.reviewId ? 'edit' : 'create';

      if (this.mode === 'edit' && this.reviewId) {
        this.loadReview();
      } else {
        this.route.queryParams.subscribe(queryParams => {
          this.orderId = queryParams['orderId'] ? +queryParams['orderId'] : undefined;
          this.productId = queryParams['productId'] ? +queryParams['productId'] : undefined;
          this.productName = queryParams['productName'] || 'Producto';
          this.productImageUrl = typeof queryParams['imageUrl'] === 'string' ? queryParams['imageUrl'] : null;
          if (!this.orderId || !this.productId) {
            this.toastService.showToast('Parámetros inválidos para crear reseña.', 'error');
            this.router.navigate(['/my-reviews']);
          }
        });
      }
    });
  }

  loadReview(): void {
    if (!this.reviewId) return;
    this.isLoading = true;
    this.reviewService.getReviewById(this.reviewId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rating = response.data.rating;
          this.comment = response.data.comment || '';
          this.existingMedia = response.data.media || [];
          this.productName = response.data.product_name || 'Producto';
          this.orderId = response.data.order_id;
          this.productId = response.data.product_id;
          this.productImageUrl = response.data.image_url ?? null; // Handle undefined by converting to null
        } else {
          this.toastService.showToast(response.message || 'Error al cargar la reseña.', 'error');
          this.router.navigate(['/my-reviews']);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.showToast(error.message || 'Error al cargar la reseña.', 'error');
        this.router.navigate(['/my-reviews']);
        this.isLoading = false;
      }
    });
  }

  setRating(rating: number): void {
    this.rating = rating;
  }

  setHoverRating(rating: number): void {
    this.hoverRating = rating;
  }

  resetHoverRating(): void {
    this.hoverRating = 0;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const newFiles = Array.from(input.files);
      const totalFiles = this.files.length + newFiles.length;
      if (totalFiles > 5) {
        this.toastService.showToast('No se pueden subir más de 5 archivos.', 'error');
        return;
      }
      this.files = [...this.files, ...newFiles.filter(file => 
        ['image/jpeg', 'image/png', 'video/mp4'].includes(file.type) && file.size <= 5 * 1024 * 1024
      )];
      if (this.files.length < newFiles.length) {
        this.toastService.showToast('Algunos archivos no cumplen con los requisitos (JPEG, PNG, MP4; máx. 5MB).', 'error');
      }
    }
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
  }

  toggleMediaToDelete(mediaId: number): void {
    if (this.mediaToDelete.includes(mediaId)) {
      this.mediaToDelete = this.mediaToDelete.filter(id => id !== mediaId);
    } else {
      this.mediaToDelete.push(mediaId);
    }
  }

  submitReview(): void {
    if (!this.rating || this.rating < 1 || this.rating > 5) {
      this.toastService.showToast('Por favor, selecciona una calificación entre 1 y 5 estrellas.', 'error');
      return;
    }

    this.isLoading = true;
    if (this.mode === 'create') {
      if (!this.orderId || !this.productId) {
        this.toastService.showToast('Faltan datos del pedido o producto.', 'error');
        this.isLoading = false;
        return;
      }
      const data: CreateReviewRequest = {
        product_id: this.productId,
        order_id: this.orderId,
        rating: this.rating,
        comment: this.comment.trim() || undefined
      };
      this.reviewService.createReview(data, this.files).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.showToast('Reseña creada exitosamente.', 'success');
            this.router.navigate(['/my-reviews'], { queryParams: { tab: 'completed' } });
          } else {
            this.toastService.showToast(response.message || 'Error al crear la reseña.', 'error');
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.toastService.showToast(error.message || 'Error al crear la reseña.', 'error');
          this.isLoading = false;
        }
      });
    } else {
      if (!this.reviewId) {
        this.toastService.showToast('ID de reseña inválido.', 'error');
        this.isLoading = false;
        return;
      }
      const data: UpdateReviewRequest = {
        rating: this.rating,
        comment: this.comment.trim() || undefined,
        media_to_delete: this.mediaToDelete.length ? this.mediaToDelete : undefined
      };
      this.reviewService.updateReview(this.reviewId, data, this.files).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.showToast('Reseña actualizada exitosamente.', 'success');
            this.router.navigate(['/my-reviews'], { queryParams: { tab: 'completed' } });
          } else {
            this.toastService.showToast(response.message || 'Error al actualizar la reseña.', 'error');
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.toastService.showToast(error.message || 'Error al actualizar la reseña.', 'error');
          this.isLoading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/my-reviews']);
  }

  getStarClass(index: number): string {
    const starValue = index + 1;
    return this.rating >= starValue || this.hoverRating >= starValue
      ? 'fas fa-star text-yellow-400 text-lg'
      : 'far fa-star text-yellow-400 text-lg';
  }

  getMediaPreviewUrl(media: Review['media'][0] | File): string {
    if (media instanceof File) {
      return URL.createObjectURL(media);
    }
    return media.url || 'https://via.placeholder.com/100?text=No+Image';
  }
}