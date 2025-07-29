import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/config';
import { CsrfService } from './csrf.service';

// Interfaces para tipar las respuestas
export interface Product {
  product_id: number;
  name: string;
  category: string | null;
  product_type: string;
  min_price: number;
  max_price: number;
  total_stock: number;
  variant_count: number;
  image_url: string | null;
  collaborator?: { id: number; name: string } | null;
  average_rating: number;
  total_reviews: number;
}

export interface ProductVariant {
  variant_id: number;
  sku: string;
  calculated_price: number;
  stock: number;
  attributes: {
    attribute_name: string;
    value: string;
    data_type: string;
    allowed_values: string;
  }[];
  images: {
    image_url: string;
    order: number;
  }[];
  average_rating: number;
  total_reviews: number;
}

export interface ProductBreadcrumb {
  id: number | null;
  name: string;
}

export interface ProductDetail {
  product_id: number;
  name: string;
  description: string | null;
  product_type: string;
  category: { category_id: number; name: string } | null;
  variants: ProductVariant[];
  customizations: { option_id?: number; type: string; description: string }[];
  standard_delivery_days: number;
  urgent_delivery_enabled: boolean;
  urgent_delivery_days: number | null;
  urgent_delivery_cost: number;
  collaborator?: { id: number; name: string } | null;
  breadcrumb: ProductBreadcrumb[];
  average_rating: number;
  total_reviews: number;
}

export interface ProductResponse {
  message: string;
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Servicio para interactuar con el endpoint unificado de productos (/collection).
 * Soporta búsqueda, filtros, paginación y autenticación opcional.
 */
@Injectable({
  providedIn: 'root'
})
export class ProductCollectionService {
  private apiUrl = `${environment.baseUrl}/products/collection`;

  constructor(
    private http: HttpClient,
    private csrfService: CsrfService
  ) {}

  /**
   * Obtiene una lista de productos con filtros y paginación.
   * Si el usuario está autenticado, incluye el token CSRF y cookies.
   * @param filters Filtros opcionales para la búsqueda y paginación.
   * @param filters.page Página actual (default: 1).
   * @param filters.pageSize Tamaño de la página (default: 20).
   * @param filters.sort Ordenamiento (ej. 'name:ASC').
   * @param filters.categoryId ID de la categoría.
   * @param filters.search Término de búsqueda (nombre, descripción, SKU, colaborador si autenticado).
   * @param filters.minPrice Precio mínimo.
   * @param filters.maxPrice Precio máximo.
   * @param filters.collaboratorId ID del colaborador.
   * @param filters.averageRating Calificación promedio (entero 0-5).
   * @param filters.attributes Atributos del producto (JSON).
   * @param isAuthenticated Indica si el usuario está autenticado (para incluir token CSRF y cookies).
   * @returns Observable con la respuesta del servidor.
   */
  getAllProducts(filters: any = {}, isAuthenticated: boolean = false): Observable<ProductResponse> {
    if (filters.page < 1 || filters.pageSize < 1) {
      return throwError(() => new Error('Parámetros de paginación inválidos'));
    }

    let params = new HttpParams()
      .set('page', (filters.page || 1).toString())
      .set('pageSize', (filters.pageSize || 20).toString());

    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId.toString());
    if (filters.search && filters.search.trim()) params = params.set('search', filters.search.trim());
    if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.collaboratorId) params = params.set('collaboratorId', filters.collaboratorId.toString());
    if (filters.averageRating !== undefined && filters.averageRating !== null) {
      params = params.set('averageRating', filters.averageRating.toString());
    }
    if (filters.attributes) params = params.set('attributes', JSON.stringify(filters.attributes));

    if (isAuthenticated) {
      // Solicitud autenticada: incluye token CSRF y cookies
      return this.csrfService.getCsrfToken().pipe(
        switchMap(csrfToken => {
          const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
          return this.http.get<ProductResponse>(this.apiUrl, { headers, params, withCredentials: true }).pipe(
            catchError(error => {
              let errorMessage = 'No se pudieron cargar los productos. Intenta de nuevo más tarde.';
              if (error.status === 400) {
                errorMessage = 'Parámetros de búsqueda inválidos.';
              } else if (error.status === 401) {
                errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
              }
              console.error('Error al obtener productos:', error);
              return throwError(() => new Error(errorMessage));
            })
          );
        })
      );
    } else {
      // Solicitud pública: sin token CSRF ni cookies
      return this.http.get<ProductResponse>(this.apiUrl, { params }).pipe(
        catchError(error => {
          let errorMessage = 'No se pudieron cargar los productos. Intenta de nuevo más tarde.';
          if (error.status === 400) {
            errorMessage = 'Parámetros de búsqueda inválidos.';
          }
          console.error('Error al obtener productos públicos:', error);
          return throwError(() => new Error(errorMessage));
        })
      );
    }
  }

  /**
   * Obtiene los detalles de un producto específico por ID.
   * Si el usuario está autenticado, incluye el token CSRF y cookies.
   * @param productId ID del producto.
   * @param isAuthenticated Indica si el usuario está autenticado (para incluir token CSRF y cookies).
   * @returns Observable con los detalles del producto.
   */
  getProductById(productId: number, isAuthenticated: boolean = false): Observable<{ message: string; product: ProductDetail }> {
    if (!productId || productId <= 0) {
      return throwError(() => new Error('ID de producto inválido'));
    }

    if (isAuthenticated) {
      // Solicitud autenticada: incluye token CSRF y cookies
      return this.csrfService.getCsrfToken().pipe(
        switchMap(csrfToken => {
          const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
          return this.http.get<{ message: string; product: ProductDetail }>(
            `${this.apiUrl}/${productId}`,
            { headers, withCredentials: true }
          ).pipe(
            catchError(error => {
              let errorMessage = 'No se pudo cargar el producto. Intenta de nuevo más tarde.';
              if (error.status === 404) {
                errorMessage = 'Producto no encontrado.';
              } else if (error.status === 401) {
                errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
              }
              console.error('Error al obtener el producto:', error);
              return throwError(() => new Error(errorMessage));
            })
          );
        })
      );
    } else {
      // Solicitud pública: sin token CSRF ni cookies
      return this.http.get<{ message: string; product: ProductDetail }>(
        `${this.apiUrl}/${productId}`
      ).pipe(
        catchError(error => {
          let errorMessage = 'No se pudo cargar el producto. Intenta de nuevo más tarde.';
          if (error.status === 404) {
            errorMessage = 'Producto no encontrado.';
          }
          console.error('Error al obtener el producto público:', error);
          return throwError(() => new Error(errorMessage));
        })
      );
    }
  }
}