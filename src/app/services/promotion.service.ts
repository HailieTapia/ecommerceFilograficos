import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { CsrfService } from './csrf.service';
import { environment } from '../environments/config';

export interface Promotion {
  promotion_id: number;
  name: string;
  coupon_type: 'percentage_discount' | 'fixed_discount' | 'free_shipping';
  discount_value: number;
  max_uses?: number | null;
  max_uses_per_user?: number | null;
  min_order_value?: number | null;
  free_shipping_enabled: boolean;
  applies_to: 'specific_products' | 'specific_categories' | 'all';
  is_exclusive: boolean;
  start_date: string;
  end_date: string;
  coupon_code?: string | null;
  status_type?: 'current' | 'future' | 'expired';
  created_by?: number;
  variantIds?: number[];
  categoryIds?: number[];
  restrict_to_cluster: boolean;
  cluster_id?: number;
  product_variants_count?: number;
  category_count?: number;
  created_at?: string;
  updated_at?: string | null;
  ProductVariants?: Variant[];
  Categories?: { category_id: number; name: string }[];
}

export interface PromotionData {
  name: string;
  coupon_type: 'percentage_discount' | 'fixed_discount' | 'free_shipping';
  discount_value: number;
  max_uses?: number | null;
  max_uses_per_user?: number | null;
  min_order_value?: number | null;
  free_shipping_enabled: boolean;
  applies_to: 'specific_products' | 'specific_categories' | 'all';
  is_exclusive: boolean;
  start_date: string;
  end_date: string;
  coupon_code?: string | null;
  variantIds?: number[];
  categoryIds?: number[];
  restrict_to_cluster: boolean;
  cluster_id?: number;
}

export interface Variant {
  variant_id: number;
  product_name: string;
  sku: string;
  image_url?: string | null;
}

export interface PromotionQueryParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  search?: string;
  statusFilter?: 'current' | 'future' | 'expired' | 'all';
}

export interface VariantQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ApplyPromotionRequest {
  promotion_id?: number;
  coupon_code?: string;
}

export interface ApplyPromotionResponse {
  message: string;
  cart: {
    cart_id: number;
    total: number;
    total_discount: number;
    coupon_code: string | null;
  };
  promotion: {
    promotion_id: number;
    name: string;
    coupon_type: 'percentage_discount' | 'fixed_discount' | 'free_shipping';
    discount_value: number;
    coupon_code: string | null;
    promotion_progress: {
      message: string;
      is_eligible: boolean;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private apiUrl = `${environment.baseUrl}/promotions`;

  constructor(private csrfService: CsrfService, private http: HttpClient) { }

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
        if (params.statusFilter) queryParams.set('statusFilter', params.statusFilter);

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

  applyPromotion(data: ApplyPromotionRequest): Observable<ApplyPromotionResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post<ApplyPromotionResponse>(
          `${this.apiUrl}/apply`,
          data,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  getAvailablePromotions(): Observable<{
    message: string;
    promotions: Promotion[];
    promotionProgress: {
      promotion_id: number;
      name: string;
      coupon_type: 'percentage_discount' | 'fixed_discount' | 'free_shipping';
      discount_value: number;
      is_applicable: boolean;
      coupon_code: string | null;
      progress_message: string;
    }[];
  }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<{
          message: string;
          promotions: Promotion[];
          promotionProgress: {
            promotion_id: number;
            name: string;
            coupon_type: 'percentage_discount' | 'fixed_discount' | 'free_shipping';
            discount_value: number;
            is_applicable: boolean;
            coupon_code: string | null;
            progress_message: string;
          }[];
        }>(
          `${this.apiUrl}/available`,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }
}