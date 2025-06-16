import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/config';

// Interfaces para tipar las respuestas
export interface Product {
  product_id: number;
  name: string;
  category: string | null;
  product_type: string;
  min_price: number;
  max_price: number;
  total_stock: number;
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

export interface ProductDetail {
  product_id: number;
  name: string;
  description: string | null;
  product_type: string;
  category: { category_id: number; name: string } | null;
  variants: ProductVariant[];
  customizations: { type: string; description: string }[];
  standard_delivery_days: number;
  urgent_delivery_enabled: boolean;
  urgent_delivery_days: number | null;
  urgent_delivery_cost: number;
  collaborator?: { id: number; name: string } | null; // Añadido para soportar collaborator
}

export interface ProductResponse {
  message: string;
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Servicio para interactuar con el endpoint público de productos.
 * Soporta búsqueda, filtros y paginación.
 */
@Injectable({
  providedIn: 'root'
})
export class PublicProductService {
  private apiUrl = `${environment.baseUrl}/products/public-catalog`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene una lista de productos con filtros y paginación.
   * @param page Página actual (default: 1).
   * @param pageSize Tamaño de la página (default: 10).
   * @param filters Filtros opcionales para la búsqueda.
   * @param filters.sort Ordenamiento (ej. 'name:ASC').
   * @param filters.categoryId ID de la categoría.
   * @param filters.search Término de búsqueda (nombre, descripción, SKU).
   * @param filters.minPrice Precio mínimo.
   * @param filters.maxPrice Precio máximo.
   * @param filters.collaboratorId ID del colaborador.
   * @param filters.attributes Atributos del producto (JSON).
   * @returns Observable con la respuesta del servidor.
   */
  getAllProducts(
    page: number = 1,
    pageSize: number = 10,
    filters: any = {}
  ): Observable<ProductResponse> {
    if (page < 1 || pageSize < 1) {
      return throwError(() => new Error('Parámetros de paginación inválidos'));
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId.toString());
    if (filters.search && filters.search.trim()) params = params.set('search', filters.search.trim());
    if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.collaboratorId) params = params.set('collaboratorId', filters.collaboratorId.toString());
    if (filters.attributes) params = params.set('attributes', JSON.stringify(filters.attributes));

    return this.http.get<ProductResponse>(this.apiUrl, { params }).pipe(
      catchError(error => {
        console.error('Error al obtener productos públicos:', error);
        return throwError(() => new Error('No se pudieron cargar los productos. Intenta de nuevo más tarde.'));
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

    return this.http.get<{ message: string; product: ProductDetail }>(`${this.apiUrl}/${productId}`).pipe(
      catchError(error => {
        console.error('Error al obtener el producto:', error);
        return throwError(() => new Error('No se pudo cargar el producto. Intenta de nuevo más tarde.'));
      })
    );
  }
}