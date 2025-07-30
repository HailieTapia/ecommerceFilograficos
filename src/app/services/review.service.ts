import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, retry, map } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { AuthService } from './auth.service';
import { environment } from '../environments/config';

// Interfaces para tipar las respuestas y solicitudes del backend
export interface ReviewMedia {
  media_id: number;
  url: string;
  media_type: 'image' | 'video';
}

export interface Review {
  review_id: number;
  user_name: string;
  rating: number;
  comment?: string;
  product_id: number;
  order_id: number;
  media: ReviewMedia[];
  created_at: string;
  product_name?: string;
  user_email?: string;
  image_url?: string | null;
}

export interface PendingReview {
  order_id: number;
  product_id: number;
  product_name: string;
  order_date: string;
  image_url: string | null;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PendingReviewsResponse {
  pendingReviews: PendingReview[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: string]: number };
}

export interface CreateReviewRequest {
  product_id: number;
  order_id: number;
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
  media_to_delete?: number[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.baseUrl}/reviews`;

  constructor(
    private csrfService: CsrfService,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Función auxiliar para construir FormData y validar datos
  private buildFormData(data: CreateReviewRequest | UpdateReviewRequest, files?: File[]): FormData {
    const formData = new FormData();

    // Validar y agregar campos
    if ('product_id' in data && data.product_id) {
      if (!Number.isInteger(data.product_id) || data.product_id <= 0) {
        throw new Error('El ID del producto debe ser un número entero positivo');
      }
      formData.append('product_id', data.product_id.toString());
    }
    if ('order_id' in data && data.order_id) {
      if (!Number.isInteger(data.order_id) || data.order_id <= 0) {
        throw new Error('El ID del pedido debe ser un número entero positivo');
      }
      formData.append('order_id', data.order_id.toString());
    }
    if ('rating' in data && data.rating !== undefined) {
      if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
        throw new Error('La calificación debe ser un número entero entre 1 y 5');
      }
      formData.append('rating', data.rating.toString());
    }
    if ('comment' in data && data.comment !== undefined) {
      formData.append('comment', data.comment);
    }
    if ('media_to_delete' in data && data.media_to_delete?.length) {
      data.media_to_delete.forEach(id => {
        if (!Number.isInteger(id) || id <= 0) {
          throw new Error('Cada ID de medio a eliminar debe ser un número entero positivo');
        }
        formData.append('media_to_delete[]', id.toString());
      });
    }

    // Validar y agregar archivos
    if (files?.length) {
      if (files.length > 5) {
        throw new Error('No se pueden subir más de 5 archivos');
      }
      files.forEach(file => {
        if (!['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'].includes(file.type)) {
          throw new Error(`Tipo de archivo no permitido: ${file.name}`);
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`El archivo ${file.name} excede el tamaño máximo de 5MB`);
        }
        formData.append('reviewMedia', file);
      });
    }

    return formData;
  }

  // Obtener resumen de reseñas por producto (pública)
  getReviewsSummaryByProduct(productId: number): Observable<ReviewSummary> {
    return this.http.get<ApiResponse<ReviewSummary>>(`${this.apiUrl}/product/${productId}/summary`).pipe(
      retry(2),
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al obtener el resumen de reseñas');
        }
        return response.data;
      }),
      catchError(error => {
        const errorMessage = error.status === 404
          ? 'Producto no encontrado'
          : error.status === 500
          ? 'Error del servidor al obtener el resumen de reseñas'
          : error.message || 'Error desconocido al obtener el resumen de reseñas';
        console.error('Error al obtener el resumen de reseñas:', error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Obtener reseñas por producto (pública)
  getReviewsByProduct(
    productId: number,
    page: number = 1,
    pageSize: number = 20,
    filters: { withPhotos?: boolean; withComments?: boolean; sort?: 'created_at' | 'rating'; order?: 'ASC' | 'DESC' } = {}
  ): Observable<ReviewsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (filters.withPhotos !== undefined) {
      params = params.set('withPhotos', filters.withPhotos.toString());
    }
    if (filters.withComments !== undefined) {
      params = params.set('withComments', filters.withComments.toString());
    }
    if (filters.sort) {
      params = params.set('sort', filters.sort);
    }
    if (filters.order) {
      params = params.set('order', filters.order);
    }

    return this.http.get<ApiResponse<ReviewsResponse>>(`${this.apiUrl}/product/${productId}`, { params }).pipe(
      retry(2),
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al obtener reseñas');
        }
        return response.data;
      }),
      catchError(error => {
        const errorMessage = error.status === 404
          ? 'No se encontraron reseñas para el producto'
          : error.status === 500
          ? 'Error del servidor al obtener reseñas'
          : error.message || 'Error desconocido al obtener reseñas';
        console.error('Error al obtener reseñas del producto:', error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Obtener reseña por ID (pública)
  getReviewById(reviewId: number): Observable<ApiResponse<Review>> {
    return this.http.get<ApiResponse<Review>>(`${this.apiUrl}/${reviewId}`).pipe(
      retry(2),
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al obtener la reseña');
        }
        return response;
      }),
      catchError(error => {
        const errorMessage = error.status === 404
          ? 'Reseña no encontrada'
          : error.status === 500
          ? 'Error del servidor al obtener la reseña'
          : error.message || 'Error desconocido al obtener la reseña';
        console.error('Error al obtener la reseña:', error);
        return of({ success: false, message: errorMessage });
      })
    );
  }

  // Crear una nueva reseña (autenticado)
  createReview(data: CreateReviewRequest, files?: File[]): Observable<ApiResponse<Review>> {
    if (!this.authService.isLoggedIn()) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    if (!data.product_id || !data.order_id || !data.rating) {
      return throwError(() => new Error('Faltan datos requeridos: product_id, order_id o rating'));
    }

    try {
      const formData = this.buildFormData(data, files);
      return this.csrfService.getCsrfToken().pipe(
        switchMap(csrfToken => {
          const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
          return this.http.post<ApiResponse<Review>>(
            `${this.apiUrl}`,
            formData,
            { headers, withCredentials: true }
          ).pipe(
            catchError(error => {
              const errorMessage = error.status === 400
                ? 'Datos inválidos al crear la reseña'
                : error.status === 403
                ? 'No tienes permiso para crear esta reseña'
                : error.error?.message || 'Error desconocido al crear la reseña';
              console.error('Error al crear la reseña:', error);
              return throwError(() => new Error(errorMessage));
            })
          );
        })
      );
    } catch (error: any) {
      return throwError(() => new Error(error.message || 'Error al preparar los datos de la reseña'));
    }
  }

  // Actualizar una reseña existente (autenticado, propietario)
  updateReview(reviewId: number, data: UpdateReviewRequest, files?: File[]): Observable<ApiResponse<null>> {
    if (!this.authService.isLoggedIn()) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    if (!data.rating && data.comment === undefined && (!data.media_to_delete || !data.media_to_delete.length) && (!files || !files.length)) {
      return throwError(() => new Error('No se proporcionaron datos para actualizar'));
    }

    try {
      const formData = this.buildFormData(data, files);
      return this.csrfService.getCsrfToken().pipe(
        switchMap(csrfToken => {
          const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
          return this.http.put<ApiResponse<null>>(
            `${this.apiUrl}/${reviewId}`,
            formData,
            { headers, withCredentials: true }
          ).pipe(
            catchError(error => {
              const errorMessage = error.status === 400
                ? 'Datos inválidos al actualizar la reseña'
                : error.status === 403
                ? 'No tienes permiso para actualizar esta reseña'
                : error.error?.message || 'Error desconocido al actualizar la reseña';
              console.error('Error al actualizar la reseña:', error);
              return throwError(() => new Error(errorMessage));
            })
          );
        })
      );
    } catch (error: any) {
      return throwError(() => new Error(error.message || 'Error al preparar los datos de la reseña'));
    }
  }

  // Eliminar una reseña (autenticado, propietario)
  deleteReviewByOwner(reviewId: number): Observable<ApiResponse<null>> {
    if (!this.authService.isLoggedIn()) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${reviewId}`, { headers, withCredentials: true }).pipe(
          catchError(error => {
            const errorMessage = error.status === 403
              ? 'No tienes permiso para eliminar esta reseña'
              : error.status === 404
              ? 'Reseña no encontrada'
              : error.error?.message || 'Error desconocido al eliminar la reseña';
            console.error('Error al eliminar la reseña:', error);
            return throwError(() => new Error(errorMessage));
          })
        );
      })
    );
  }

  // Obtener reseñas del usuario autenticado
  getUserReviews(page: number = 1, pageSize: number = 20): Observable<ReviewsResponse> {
    if (!this.authService.isLoggedIn()) {
      return of({ reviews: [], total: 0, page, pageSize });
    }

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const params = new HttpParams()
          .set('page', page.toString())
          .set('pageSize', pageSize.toString());

        return this.http.get<ApiResponse<ReviewsResponse>>(`${this.apiUrl}/my-reviews`, { headers, params, withCredentials: true }).pipe(
          retry(2),
          map(response => {
            if (!response.success || !response.data) {
              throw new Error(response.message || 'Error al obtener reseñas del usuario');
            }
            return response.data;
          }),
          catchError(error => {
            const errorMessage = error.status === 403
              ? 'No tienes permiso para ver tus reseñas'
              : error.status === 500
              ? 'Error del servidor al obtener reseñas'
              : error.message || 'Error desconocido al obtener reseñas';
            console.error('Error al obtener reseñas del usuario:', error);
            return throwError(() => new Error(errorMessage));
          })
        );
      })
    );
  }

  // Obtener compras pendientes de reseña
  getPendingReviews(page: number = 1, pageSize: number = 20): Observable<PendingReviewsResponse> {
    if (!this.authService.isLoggedIn()) {
      return of({ pendingReviews: [], total: 0, page, pageSize });
    }

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const params = new HttpParams()
          .set('page', page.toString())
          .set('pageSize', pageSize.toString());

        return this.http.get<ApiResponse<PendingReviewsResponse>>(`${this.apiUrl}/pending`, { headers, params, withCredentials: true }).pipe(
          retry(2),
          map(response => {
            if (!response.success || !response.data) {
              throw new Error(response.message || 'Error al obtener compras pendientes de reseña');
            }
            return response.data;
          }),
          catchError(error => {
            const errorMessage = error.status === 403
              ? 'No tienes permiso para ver compras pendientes'
              : error.status === 500
              ? 'Error del servidor al obtener compras pendientes'
              : error.message || 'Error desconocido al obtener compras pendientes';
            console.error('Error al obtener compras pendientes de reseña:', error);
            return throwError(() => new Error(errorMessage));
          })
        );
      })
    );
  }

  // Obtener reseñas para administradores (autenticado, administrador)
  getReviewsForAdmin(
    page: number = 1,
    pageSize: number = 20,
    filters: { productId?: number; userId?: number; minRating?: number; maxRating?: number } = {}
  ): Observable<ReviewsResponse> {
    if (!this.authService.isLoggedIn()) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        let params = new HttpParams()
          .set('page', page.toString())
          .set('pageSize', pageSize.toString());
        if (filters.productId) {
          params = params.set('productId', filters.productId.toString());
        }
        if (filters.userId) {
          params = params.set('userId', filters.userId.toString());
        }
        if (filters.minRating) {
          params = params.set('minRating', filters.minRating.toString());
        }
        if (filters.maxRating) {
          params = params.set('maxRating', filters.maxRating.toString());
        }

        return this.http.get<ApiResponse<ReviewsResponse>>(`${this.apiUrl}/admin`, { headers, params, withCredentials: true }).pipe(
          retry(2),
          map(response => {
            if (!response.success || !response.data) {
              throw new Error(response.message || 'Error al obtener reseñas para administradores');
            }
            return response.data;
          }),
          catchError(error => {
            const errorMessage = error.status === 403
              ? 'No tienes permiso para ver reseñas como administrador'
              : error.status === 500
              ? 'Error del servidor al obtener reseñas'
              : error.message || 'Error desconocido al obtener reseñas';
            console.error('Error al obtener reseñas para administradores:', error);
            return throwError(() => new Error(errorMessage));
          })
        );
      })
    );
  }

  // Eliminar una reseña como administrador (autenticado, administrador)
  deleteReviewByAdmin(reviewId: number): Observable<ApiResponse<null>> {
    if (!this.authService.isLoggedIn()) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/admin/${reviewId}`, { headers, withCredentials: true }).pipe(
          catchError(error => {
            const errorMessage = error.status === 403
              ? 'No tienes permiso para eliminar esta reseña como administrador'
              : error.status === 404
              ? 'Reseña no encontrada'
              : error.error?.message || 'Error desconocido al eliminar la reseña';
            console.error('Error al eliminar la reseña por administrador:', error);
            return throwError(() => new Error(errorMessage));
          })
        );
      })
    );
  }
}