import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/config';
import { switchMap, tap, catchError } from 'rxjs/operators';
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

interface ProductDetail {
  product_id: number;
  name: string;
  description: string | null;
  product_type: string;
  category: { category_id: number; name: string } | null;
  variants: ProductVariant[];
  customizations: { type: string; description: string }[];
}

interface ProductResponse {
  message: string;
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthProductService {
  private apiUrl = `${environment.baseUrl}/products/auth-catalog`;

  constructor(private csrfService: CsrfService, private http: HttpClient) { }

  getAllProducts(page: number = 1, pageSize: number = 10, filters: any = {}): Observable<ProductResponse> {

    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.collaboratorId) params = params.set('collaboratorId', filters.collaboratorId.toString());
    if (filters.attributes) params = params.set('attributes', JSON.stringify(filters.attributes));
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<ProductResponse>(this.apiUrl, { headers, params, withCredentials: true });
      })
    );
  }
  getProductById(productId: number): Observable<{ message: string; product: ProductDetail }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<{ message: string; product: ProductDetail }>(`${this.apiUrl}/${productId}`, { headers, withCredentials: true });
      })
    );
  }
}