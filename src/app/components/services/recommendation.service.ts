import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { CsrfService } from './csrf.service';
import { environment } from '../../environments/config';

// Interfaces for typing backend responses
export interface Recommendation {
  product_id: number;
  name: string | null;
  description: string | null;
  product_type: string | null;
  average_rating: string;
  total_reviews: number;
  min_price: number | null;
  max_price: number | null;
  total_stock: number;
  variant_count: number;
  category: string | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  collaborator: string | null;
  standard_delivery_days: number | null;
  urgent_delivery_enabled: boolean;
  urgent_delivery_days: number | null;
  urgent_delivery_cost: number | null;
}

export interface RecommendationResponse {
  success: boolean;
  message: string;
  error?: string;
  data: {
    product?: string;
    cart?: string[];
    recommendations: Recommendation[];
    count: number;
  };
}

export interface HealthResponse {
  success: boolean;
  message: string;
  error?: string;
  data: {
    status: string;
    model_loaded: boolean;
    rules_count: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private apiUrl = `${environment.baseUrl}/recommendations`;

  constructor(
    private csrfService: CsrfService,
    private http: HttpClient
  ) {}

  // Error handling
  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Error en la comunicación con el servidor';
    if (error.error?.error) {
      message = `Error del servidor: ${error.error.error}`;
    } else if (error.status) {
      message = `Error HTTP ${error.status}: ${error.message}`;
    }
    console.error('Error al procesar la solicitud:', error);
    return throwError(() => new Error(message));
  }

  /**
   * Gets recommendations based on a single product or a cart.
   * @param input Either a product name (string) or a cart (array of strings).
   * @returns Observable with the recommendations.
   */
  getRecommendations(input: string | string[]): Observable<RecommendationResponse> {
    // Validate input
    if (!input) {
      console.error('Input no proporcionado');
      return throwError(() => new Error('Se requiere un producto o un carrito'));
    }
    if (typeof input === 'string' && input.trim() === '') {
      console.error('El nombre del producto no puede estar vacío');
      return throwError(() => new Error('El nombre del producto no puede estar vacío'));
    }
    if (Array.isArray(input)) {
      if (input.length === 0) {
        console.error('El carrito no puede estar vacío');
        return throwError(() => new Error('El carrito no puede estar vacío'));
      }
      if (!input.every(item => typeof item === 'string' && item.trim() !== '')) {
        console.error('Todos los elementos del carrito deben ser strings no vacíos');
        return throwError(() => new Error('Todos los elementos del carrito deben ser strings no vacíos'));
      }
    }

    // Normalize input
    const normalizedInput = typeof input === 'string' ? input.trim() : input.map(item => item.trim());
    const payload = typeof input === 'string' ? { product: normalizedInput } : { cart: normalizedInput };

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        if (!csrfToken) {
          console.error('No se pudo obtener el CSRF token');
          return throwError(() => new Error('Error al obtener el token CSRF'));
        }
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        });
        return this.http.post<RecommendationResponse>(
          this.apiUrl,
          payload,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Checks the health status of the recommendation service.
   * @returns Observable with the health status.
   */
  checkHealth(): Observable<HealthResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        });
        return this.http.get<HealthResponse>(
          `${this.apiUrl}/health`,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }
}