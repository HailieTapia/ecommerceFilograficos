import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { CsrfService } from './csrf.service';
import { environment } from '../environments/config';

// Interfaz para tipar las promociones
export interface Promotion {
  promotion_id: number;
  name: string;
  coupon_type: 'quantity_discount' | 'order_count_discount' | 'unit_discount';
  discount_value: number;
  min_quantity?: number | null;
  min_order_count?: number | null;
  min_unit_measure?: number | null;
  max_uses?: number | null;
  max_uses_per_user?: number | null;
  min_order_value?: number | null;
  free_shipping_enabled?: boolean;
  applies_to: 'specific_products' | 'specific_categories' | 'all';
  is_exclusive: boolean;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive';
  created_by?: number;
  created_at?: string;
  updated_by?: number | null;
  updated_at?: string | null;
  coupon_code?: string | null;
  ProductVariants?: { variant_id: number; sku: string; product_name?: string }[];
  Categories?: { category_id: number; name: string }[];
  product_variants_count?: number;
  category_count?: number;
}

// Interfaz para los parámetros de consulta de getAllPromotions
export interface PromotionQueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

// Interfaz para tipar las variantes
export interface Variant {
  variant_id: number;
  sku: string;
  product_name: string;
  image_url: string | null;
}

// Interfaz para los parámetros de consulta de getAllVariants
export interface VariantQueryParams {
  search?: string;
}

// Interfaz para los datos de creación/actualización de una promoción
export interface PromotionData {
  name: string;
  coupon_type: 'quantity_discount' | 'order_count_discount' | 'unit_discount';
  discount_value: number;
  min_quantity?: number | null;
  min_order_count?: number | null;
  min_unit_measure?: number | null;
  max_uses?: number | null;
  max_uses_per_user?: number | null;
  min_order_value?: number | null;
  free_shipping_enabled?: boolean;
  applies_to: 'specific_products' | 'specific_categories' | 'all';
  is_exclusive: boolean;
  start_date: string;
  end_date: string;
  status?: 'active' | 'inactive';
  variantIds?: number[];
  categoryIds?: number[];
  coupon_code?: string | null;
}

// Interfaz para aplicar promoción/cupón
export interface ApplyPromotionRequest {
  promotion_id?: number;
  coupon_code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private apiUrl = `${environment.baseUrl}/promotions`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = error.error?.message || 'Error en la comunicación con el servidor';
    console.error('Error en la solicitud:', error);
    return throwError(() => new Error(message));
  }

  createPromotion(promotionData: PromotionData): Observable<{ message: string; promotion: Promotion }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post<{ message: string; promotion: Promotion }>(
          `${this.apiUrl}/`,
          promotionData,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  getPromotionById(id: number): Observable<{ message: string; promotion: Promotion }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<{ message: string; promotion: Promotion }>(
          `${this.apiUrl}/${id}`,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  getAllPromotions(params: PromotionQueryParams = {}): Observable<{
    message: string;
    promotions: Promotion[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const queryParams = new URLSearchParams();

        if (params.search) queryParams.set('search', params.search.trim());
        if (params.page) queryParams.set('page', params.page.toString());
        if (params.pageSize) queryParams.set('pageSize', params.pageSize.toString());
        if (params.sort) queryParams.set('sort', params.sort);

        const url = `${this.apiUrl}/?${queryParams.toString()}`;
        return this.http.get<{
          message: string;
          promotions: Promotion[];
          total: number;
          page: number;
          pageSize: number;
        }>(url, { headers, withCredentials: true });
      }),
      catchError(this.handleError)
    );
  }

  updatePromotion(id: number, updatedData: PromotionData): Observable<{ message: string; promotion: Promotion }> {
    if (updatedData.start_date && updatedData.end_date) {
      const startDate = new Date(updatedData.start_date);
      const endDate = new Date(updatedData.end_date);
      if (endDate <= startDate) {
        return throwError(() => new Error('La fecha de fin debe ser posterior a la fecha de inicio'));
      }
    }

    if (updatedData.applies_to === 'specific_products' && (!updatedData.variantIds || updatedData.variantIds.length === 0)) {
      return throwError(() => new Error('Debe proporcionar al menos un variantId para "specific_products"'));
    }

    if (updatedData.applies_to === 'specific_categories' && (!updatedData.categoryIds || updatedData.categoryIds.length === 0)) {
      return throwError(() => new Error('Debe proporcionar al menos un categoryId para "specific_categories"'));
    }

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put<{ message: string; promotion: Promotion }>(
          `${this.apiUrl}/${id}`,
          updatedData,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  deletePromotion(id: number): Observable<{ message: string }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.delete<{ message: string }>(
          `${this.apiUrl}/${id}`,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  getAllVariants(params: VariantQueryParams = {}): Observable<{
    message: string;
    variants: Variant[];
    total: number;
  }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const queryParams = new URLSearchParams();

        if (params.search) queryParams.set('search', params.search.trim());

        const url = `${this.apiUrl}/variants?${queryParams.toString()}`;
        return this.http.get<{
          message: string;
          variants: Variant[];
          total: number;
        }>(url, { headers, withCredentials: true });
      }),
      catchError(this.handleError)
    );
  }

  applyPromotion(data: ApplyPromotionRequest): Observable<{ message: string; cart_id: number; total: number; total_discount: number; coupon_code: string | null }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post<{ message: string; cart_id: number; total: number; total_discount: number; coupon_code: string | null }>(
          `${this.apiUrl}/apply`,
          data,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  getAvailablePromotions(): Observable<{ message: string; promotions: Promotion[] }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<{ message: string; promotions: Promotion[] }>(
          `${this.apiUrl}/available`,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }
}