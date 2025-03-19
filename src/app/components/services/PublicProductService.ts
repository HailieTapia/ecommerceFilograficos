import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
export class PublicProductService {
  private apiUrl = `${environment.baseUrl}/products/public-catalog`;

  constructor(private http: HttpClient) {}

  getAllProducts(
    page: number = 1,
    pageSize: number = 10,
    filters: any = {}
  ): Observable<ProductResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.attributes) params = params.set('attributes', JSON.stringify(filters.attributes));

    return this.http.get<ProductResponse>(this.apiUrl, { params });
  }

  getProductById(productId: number): Observable<{ message: string; product: ProductDetail }> {
    return this.http.get<{ message: string; product: ProductDetail }>(`${this.apiUrl}/${productId}`);
  }
}