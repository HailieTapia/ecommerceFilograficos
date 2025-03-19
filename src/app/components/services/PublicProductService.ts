import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  private apiUrl = `${environment.baseUrl}/products/public-catalog`; // Ajustado a la nueva ruta

  constructor(private http: HttpClient) {}

  // Obtener todos los productos del catálogo (público)
  getAllProducts(
    page: number = 1,
    pageSize: number = 10,
    sort?: string,
    categoryId?: number,
    search?: string
  ): Observable<ProductResponse> {
    const params: any = {
      page: page.toString(),
      pageSize: pageSize.toString()
    };
    if (sort) params.sort = sort;
    if (categoryId) params.categoryId = categoryId.toString();
    if (search) params.search = search;

    return this.http.get<ProductResponse>(this.apiUrl, { params });
  }

  // Obtener un producto por ID (público)
  getProductById(productId: number): Observable<{ message: string; product: ProductDetail }> {
    return this.http.get<{ message: string; product: ProductDetail }>(`${this.apiUrl}/${productId}`);
  }
}