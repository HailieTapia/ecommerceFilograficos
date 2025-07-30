import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../environments/config';
import { switchMap, catchError } from 'rxjs/operators';
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
}

interface ProductVariant {
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
  customizations: { option_id: number; type: string; description: string }[]; // Añadido option_id
  standard_delivery_days: number;
  urgent_delivery_enabled: boolean;
  urgent_delivery_days: number | null;
  urgent_delivery_cost: number;
  collaborator?: { id: number; name: string } | null;
  breadcrumb: ProductBreadcrumb[];
}

export interface ProductResponse {
  message: string;
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Servicio para interactuar con el endpoint autenticado de productos.
 * Soporta búsqueda, filtros y paginación.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthProductService {
  private apiUrl = `${environment.baseUrl}/products/auth-catalog`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  /**
   * Obtiene una lista de productos con filtros y paginación.
   * @param filters Filtros opcionales para la búsqueda y paginación.
   * @param filters.page Página actual (default: 1).
   * @param filters.pageSize Tamaño de la página (default: 10).
   * @param filters.sort Ordenamiento (ej. 'name:ASC').
   * @param filters.categoryId ID de la categoría.
   * @param filters.search Término de búsqueda (nombre, descripción, SKU, colaborador).
   * @param filters.minPrice Precio mínimo.
   * @param filters.maxPrice Precio máximo.
   * @param filters.collaboratorId ID del colaborador.
   * @returns Observable con la respuesta del servidor.
   */
  getAllProducts(filters: any = {}): Observable<ProductResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        let params = new HttpParams();

        if (filters) {
          if (filters.page) params = params.set('page', filters.page.toString());
          if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());
          if (filters.sort) params = params.set('sort', filters.sort);
          if (filters.categoryId) params = params.set('categoryId', filters.categoryId.toString());
          if (filters.search && filters.search.trim()) params = params.set('search', filters.search.trim());
          if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
          if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
          if (filters.collaboratorId) params = params.set('collaboratorId', filters.collaboratorId.toString());
        }

        return this.http.get<ProductResponse>(this.apiUrl, { headers, params, withCredentials: true }).pipe(
          catchError(error => {
            let errorMessage = 'No se pudieron cargar los productos. Intenta de nuevo más tarde.';
            if (error.status === 400) {
              errorMessage = 'Parámetros de búsqueda inválidos.';
            } else if (error.status === 401) {
              errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
            }
            console.error('Error al obtener productos autenticados:', error);
            return throwError(() => new Error(errorMessage));
          })
        );
      })
    );
  }

  /**
   * Obtiene los detalles de un producto específico por ID.
   * @param productId ID del producto.
   * @returns Observable con los detalles del producto.
   */
  getProductById(productId: number): Observable<{ message: string; product: ProductDetail }> {
    if (!productId || productId <= 0) {
      return throwError(() => new Error('ID de producto inválido'));
    }

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<{ message: string; product: ProductDetail }>(`${this.apiUrl}/${productId}`, { headers, withCredentials: true }).pipe(
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
  }
}