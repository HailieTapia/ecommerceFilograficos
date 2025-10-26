import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { environment } from '../environments/config';
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
   * @param isAuthenticated Indica si el usuario está autenticado.
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

    const url = `${this.apiUrl}?${params.toString()}`;

    if (isAuthenticated) {
      return this.csrfService.getCsrfToken().pipe(
        switchMap(csrfToken => {
          const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
          return this.http.get<ProductResponse>(url, { headers, params, withCredentials: true }).pipe(
            catchError((error: HttpErrorResponse) => this.handleError(error, url, 'No se pudieron cargar los productos'))
          );
        })
      );
    } else {
      return this.http.get<ProductResponse>(url, { params }).pipe(
        catchError((error: HttpErrorResponse) => this.handleError(error, url, 'No se pudieron cargar los productos públicos'))
      );
    }
  }

  /**
   * Obtiene los detalles de un producto específico por ID.
   * Si el usuario está autenticado, incluye el token CSRF y cookies.
   * @param productId ID del producto.
   * @param isAuthenticated Indica si el usuario está autenticado.
   * @returns Observable con los detalles del producto.
   */
  getProductById(productId: number, isAuthenticated: boolean = false): Observable<{ message: string; product: ProductDetail }> {
    if (!productId || productId <= 0) {
      return throwError(() => new Error('ID de producto inválido'));
    }

    const url = `${this.apiUrl}/${productId}`;

    if (isAuthenticated) {
      return this.csrfService.getCsrfToken().pipe(
        switchMap(csrfToken => {
          const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
          return this.http.get<{ message: string; product: ProductDetail }>(url, { headers, withCredentials: true }).pipe(
            catchError((error: HttpErrorResponse) => this.handleError(error, url, 'No se pudo cargar el producto'))
          );
        })
      );
    } else {
      return this.http.get<{ message: string; product: ProductDetail }>(url).pipe(
        catchError((error: HttpErrorResponse) => this.handleError(error, url, 'No se pudo cargar el producto público'))
      );
    }
  }

  /**
   * Maneja errores HTTP y verifica si está offline para intentar recuperar del caché.
   * @param error Error HTTP.
   * @param url URL de la solicitud.
   * @param defaultMessage Mensaje de error predeterminado.
   * @returns Observable con datos del caché o error.
   */
  private handleError(error: HttpErrorResponse, url: string, defaultMessage: string): Observable<any> {
    if (error.status === 0 && !navigator.onLine) {
      return this.getCachedData(url).pipe(
        catchError(() => throwError(() => new Error(`${defaultMessage}. No disponible en caché.`)))
      );
    }

    let errorMessage = defaultMessage;
    if (error.status === 400) {
      errorMessage = 'Parámetros de búsqueda inválidos.';
    } else if (error.status === 401) {
      errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
    } else if (error.status === 404) {
      errorMessage = 'Producto no encontrado.';
    }
    console.error(`Error en la solicitud: ${url}`, error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Recupera datos del caché del navegador.
   * @param url URL a buscar en el caché.
   * @returns Observable con los datos cacheados.
   */
  private getCachedData(url: string): Observable<any> {
    return from(caches.match(url)).pipe(
      map(response => {
        if (response) {
          return response.json();
        }
        throw new Error('Datos no disponibles en caché');
      })
    );
  }
}