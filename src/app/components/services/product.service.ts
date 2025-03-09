import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from './csrf.service';
import { environment } from '../../environments/config';

// Interfaces para tipado
export interface Product {
  product_id: number;
  name: string;
  category: string | null;
  product_type: 'Existencia' | 'semi_personalizado' | 'personalizado';
  variant_count: number;
  min_price: number;
  max_price: number;
  total_stock: number;
  created_at: string;
  updated_at: string;
  image_url: string | null;
}

export interface ProductResponse {
  message: string;
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Variant {
  sku: string;
  production_cost: number;
  profit_margin: number;
  stock: number;
  stock_threshold?: number;
  attributes?: { attribute_id: number; value: string }[];
  customizations?: { type: 'Imagen' | 'Texto' | 'Archivo'; description: string }[];
  images: File[];
}

export interface NewProduct {
  name: string;
  description?: string;
  product_type: 'Existencia' | 'semi_personalizado' | 'personalizado';
  category_id: number;
  collaborator_id?: number;
  variants: Variant[];
  customizations?: { type: string; description: string }[];
}

export interface DetailedVariant {
  variant_id: number;
  sku: string;
  production_cost: number;
  profit_margin: number;
  calculated_price: number;
  stock: number;
  stock_threshold?: number;
  attributes: { attribute_id: number; attribute_name: string; value: string; data_type: string; allowed_values: string | null }[];
  images: { image_url: string; order: number }[];
}

export interface DetailedProduct {
  product_id: number;
  name: string;
  description: string | null;
  product_type: 'Existencia' | 'semi_personalizado' | 'personalizado';
  category: { category_id: number; name: string } | null;
  collaborator: { collaborator_id: number; name: string } | null;
  status: string;
  variants: DetailedVariant[];
  customizations: { type: string; description: string }[];
}

export interface CreatedProductResponse {
  message: string;
  product: DetailedProduct;
}

export interface DeleteProductResponse {
  message: string;
}

export interface DetailedProductResponse {
  message: string;
  product: DetailedProduct;
}

export interface UpdateProductResponse {
  message: string;
  product: DetailedProduct;
}

// Interfaces existentes (sin cambios, solo extracto relevante)
export interface StockVariant {
  variant_id: number;
  sku: string;
  product_name: string | null;
  category_name: string | null;
  product_type: 'Existencia' | 'semi_personalizado' | 'personalizado' | null;
  stock: number;
  stock_threshold: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'no_stock'; // Añadido 'no_stock'
  first_image: string | null;
  last_updated: string;
  last_stock_added_at?: string | null; // Nuevo campo opcional
}

export interface StockVariantsResponse {
  message: string;
  variants: StockVariant[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UpdateStockRequest {
  variant_id: number;
  stock: number;
  stock_threshold?: number;
}

export interface UpdatedStockVariant {
  variant_id: number;
  sku: string;
  product_name: string | null;
  stock: number;
  stock_threshold: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'no_stock'; // Añadido 'no_stock'
  last_updated: string;
  last_stock_added_at?: string | null; // Nuevo campo opcional
}

export interface UpdateStockResponse {
  message: string;
  variant: UpdatedStockVariant;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.baseUrl}/products`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  // Métodos existentes (sin cambios)
  getAllProductsCatalog(
    page: number = 1,
    pageSize: number = 10,
    sort?: string
  ): Observable<ProductResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (sort) {
      params = params.set('sort', sort);
    }

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<ProductResponse>(`${this.apiUrl}/catalog`, {
          headers,
          params,
          withCredentials: true
        });
      })
    );
  }

  createProduct(productData: NewProduct): Observable<CreatedProductResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const formData = new FormData();

        formData.append('name', productData.name);
        formData.append('product_type', productData.product_type);
        formData.append('category_id', productData.category_id.toString());
        if (productData.description) {
          formData.append('description', productData.description);
        }
        if (productData.collaborator_id) {
          formData.append('collaborator_id', productData.collaborator_id.toString());
        }
        if (productData.customizations) {
          formData.append('customizations', JSON.stringify(productData.customizations));
        }

        formData.append('variants', JSON.stringify(productData.variants.map(v => ({
          sku: v.sku,
          production_cost: v.production_cost,
          profit_margin: v.profit_margin,
          stock: v.stock,
          stock_threshold: v.stock_threshold,
          attributes: v.attributes,
          customizations: v.customizations
        }))));

        productData.variants.forEach((variant, index) => {
          variant.images.forEach(image => {
            formData.append(`variants[${index}][images]`, image, image.name);
          });
        });

        const formDataEntries: Record<string, any> = {};
        formData.forEach((value, key) => {
          formDataEntries[key] = value;
        });
        console.log('Datos enviados en FormData (creación):', formDataEntries);

        return this.http.post<CreatedProductResponse>(`${this.apiUrl}/`, formData, {
          headers,
          withCredentials: true
        });
      })
    );
  }

  deleteProduct(productId: number): Observable<DeleteProductResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.delete<DeleteProductResponse>(`${this.apiUrl}/${productId}`, {
          headers,
          withCredentials: true
        });
      })
    );
  }

  getProductById(productId: number): Observable<DetailedProductResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<DetailedProductResponse>(`${this.apiUrl}/detail/${productId}`, {
          headers,
          withCredentials: true
        });
      })
    );
  }

  updateProduct(productId: number, productData: NewProduct): Observable<UpdateProductResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const formData = new FormData();

        formData.append('name', productData.name);
        formData.append('product_type', productData.product_type);
        formData.append('category_id', productData.category_id.toString());
        if (productData.description) {
          formData.append('description', productData.description);
        }
        if (productData.collaborator_id) {
          formData.append('collaborator_id', productData.collaborator_id.toString());
        }
        if (productData.customizations) {
          formData.append('customizations', JSON.stringify(productData.customizations));
        }

        formData.append('variants', JSON.stringify(productData.variants.map(v => ({
          sku: v.sku,
          production_cost: v.production_cost,
          profit_margin: v.profit_margin,
          stock: v.stock,
          stock_threshold: v.stock_threshold,
          attributes: v.attributes,
          customizations: v.customizations
        }))));

        productData.variants.forEach((variant, index) => {
          variant.images.forEach(image => {
            formData.append(`variants[${index}][images]`, image, image.name);
          });
        });

        const formDataEntries: Record<string, any> = {};
        formData.forEach((value, key) => {
          formDataEntries[key] = value;
        });
        console.log('Datos enviados en FormData (actualización):', formDataEntries);

        return this.http.put<UpdateProductResponse>(`${this.apiUrl}/${productId}`, formData, {
          headers,
          withCredentials: true
        });
      })
    );
  }

  // Nuevos métodos para gestión de stock

  getStockVariants(
    page: number = 1,
    pageSize: number = 10,
    categoryId?: number,
    stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'no_stock' // Añadido 'no_stock'
  ): Observable<StockVariantsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (categoryId) {
      params = params.set('category_id', categoryId.toString());
    }
    if (stockStatus) {
      params = params.set('stock_status', stockStatus);
    }

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<StockVariantsResponse>(`${this.apiUrl}/stock/variants`, {
          headers,
          params,
          withCredentials: true
        });
      })
    );
  }

  updateStock(stockData: UpdateStockRequest): Observable<UpdateStockResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders()
          .set('x-csrf-token', csrfToken)
          .set('Content-Type', 'application/json');
        return this.http.put<UpdateStockResponse>(`${this.apiUrl}/stock/update`, stockData, {
          headers,
          withCredentials: true
        });
      })
    );
  }
}