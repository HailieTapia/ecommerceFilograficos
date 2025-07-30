import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, interval, of } from 'rxjs';
import { switchMap, retry, catchError, map } from 'rxjs/operators';
import { CsrfService } from './csrf.service';
import { environment } from '../environments/config';

// Interfaces ajustadas (sin cambios)
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
  collaborator?: string | null;
  standard_delivery_days: number;
  urgent_delivery_enabled: boolean;
  urgent_delivery_days: number | null;
  urgent_delivery_cost: number | null;
}

export interface ProductResponse {
  message: string;
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Variant {
  variant_id?: number;
  sku: string;
  production_cost: number;
  profit_margin: number;
  stock: number;
  stock_threshold?: number;
  attributes?: { attribute_id: number; value: string }[];
  customizations?: { type: 'text' | 'image' | 'file'; description: string }[];
  images: File[];
  imagesToDelete?: number[];
}

export interface NewProduct {
  name: string;
  description?: string;
  product_type: 'Existencia' | 'semi_personalizado' | 'personalizado';
  category_id: number;
  collaborator_id?: number;
  variants: Variant[];
  customizations?: { type: 'text' | 'image' | 'file'; description: string }[];
  standard_delivery_days: number;
  urgent_delivery_enabled: boolean;
  urgent_delivery_days?: number;
  urgent_delivery_cost?: number;
}

export interface DeleteVariantResponse {
  message: string;
  deletedCount: number;
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
  images: { image_id: number; image_url: string; order: number }[];
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
  standard_delivery_days: number;
  urgent_delivery_enabled: boolean;
  urgent_delivery_days: number | null;
  urgent_delivery_cost: number | null;
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

export interface StockVariant {
  variant_id: number;
  sku: string;
  product_name: string | null;
  category_name: string | null;
  product_type: 'Existencia' | 'semi_personalizado' | 'personalizado' | null;
  stock: number;
  stock_threshold: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'no_stock';
  first_image: string | null;
  last_updated: string;
  last_stock_added_at?: string | null;
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
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'no_stock';
  last_updated: string;
  last_stock_added_at?: string | null;
}

export interface UpdateStockResponse {
  message: string;
  variant: UpdatedStockVariant;
}

export interface PriceVariant {
  variant_id: number;
  product_name: string;
  description: string | null;
  sku: string;
  image_url: string | null;
  calculated_price: string;
  production_cost: string;
  profit_margin: string;
  category: string | null;
  updated_at: string;
  product_type: 'Existencia' | 'semi_personalizado' | 'personalizado';
}

export interface PriceVariantsResponse {
  message: string;
  variants: PriceVariant[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PriceVariantResponse {
  message: string;
  variant: PriceVariant;
}

export interface UpdatePriceRequest {
  production_cost: number;
  profit_margin: number;
}

export interface UpdatePriceResponse {
  message: string;
  variant: PriceVariant;
}

export interface PriceHistoryEntry {
  history_id: number;
  product_name: string;
  sku: string;
  previous: {
    production_cost: string;
    profit_margin: string;
    calculated_price: string;
  };
  new: {
    production_cost: string;
    profit_margin: string;
    calculated_price: string;
  };
  change_type: 'manual' | 'promotion' | 'discount' | 'adjustment' | 'batch_update_individual' | 'batch_update';
  change_description: string;
  change_date: string;
  changed_by: {
    user_id: number;
    name: string;
    email: string;
  };
}

export interface PriceHistoryResponse {
  message: string;
  history: PriceHistoryEntry[];
}

export interface BatchUpdatePriceRequest {
  variant_ids: number[];
  production_cost: number;
  profit_margin: number;
}

export interface BatchUpdatePriceResponse {
  message: string;
  variants: PriceVariant[];
}

export interface BatchUpdatePriceIndividualVariant {
  variant_id: number;
  production_cost: number;
  profit_margin: number;
}

export interface BatchUpdatePriceIndividualRequest {
  variants: BatchUpdatePriceIndividualVariant[];
}

export interface BatchUpdatePriceIndividualResponse {
  message: string;
  variants: PriceVariant[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.baseUrl}/products`;
  private readonly CACHE_KEY = 'home-data-cache';
  private readonly CACHE_DURATION = 3600 * 1000; // 1 hora en milisegundos

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  private getCachedData(): any | null {
    const cached = localStorage.getItem(this.CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    const timestamp = parsed.timestamp;
    if (!timestamp || Date.now() - timestamp > this.CACHE_DURATION) {
      localStorage.removeItem(this.CACHE_KEY);
      return null;
    }
    return parsed.data;
  }

  private setCachedData(data: any): void {
    const cacheEntry = {
      timestamp: Date.now(),
      data
    };
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheEntry));
  }

  getHomeData(poll: boolean = false): Observable<any> {
    // Si no es polling y hay datos válidos en caché, devolverlos
    if (!poll) {
      const cachedData = this.getCachedData();
      if (cachedData) {
        return of(cachedData);
      }
    }

    // Solicitud al servidor con reintentos
    const request$ = this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<any>(`${this.apiUrl}/home-data`, {
          headers,
          withCredentials: true
        });
      }),
      retry({ count: 3, delay: 1000 }), // Reintentar 3 veces con 1 segundo de retraso
      map(response => {
        this.setCachedData(response); // Almacenar en caché
        return response;
      }),
      catchError(error => {
        console.error('Error fetching home data:', error);
        const cachedData = this.getCachedData();
        if (cachedData) {
          console.log('Returning cached data as fallback');
          return of(cachedData);
        }
        throw error; // Si no hay datos en caché, propagar el error
      })
    );

    // Si poll es true, configurar polling cada hora
    if (poll) {
      return interval(this.CACHE_DURATION).pipe(
        switchMap(() => request$)
      );
    }

    return request$;
  }

  getAllProductsCatalog(
    page: number = 1,
    pageSize: number = 10,
    sort?: string,
    search?: string,
    collaboratorId?: number,
    categoryId?: number,
    productType?: 'Existencia' | 'semi_personalizado' | 'personalizado'
  ): Observable<ProductResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (sort) params = params.set('sort', sort);
    if (search) params = params.set('search', search);
    if (collaboratorId) params = params.set('collaborator_id', collaboratorId.toString());
    if (categoryId) params = params.set('category_id', categoryId.toString());
    if (productType) params = params.set('product_type', productType);

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

  // Solo el método createProduct cambió; el resto es idéntico al código proporcionado
  createProduct(productData: NewProduct): Observable<CreatedProductResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const formData = new FormData();

        formData.append('name', productData.name);
        formData.append('product_type', productData.product_type);
        formData.append('category_id', String(productData.category_id)); // Convertir a string
        formData.append('standard_delivery_days', String(productData.standard_delivery_days)); // Convertir a string
        formData.append('urgent_delivery_enabled', String(productData.urgent_delivery_enabled)); // Convertir a string
        if (productData.description) formData.append('description', productData.description);
        if (productData.collaborator_id) formData.append('collaborator_id', String(productData.collaborator_id));
        if (productData.urgent_delivery_enabled && productData.urgent_delivery_days) {
          formData.append('urgent_delivery_days', String(productData.urgent_delivery_days));
        }
        if (productData.urgent_delivery_enabled && productData.urgent_delivery_cost) {
          formData.append('urgent_delivery_cost', String(productData.urgent_delivery_cost));
        }
        if (productData.product_type !== 'Existencia' && productData.customizations) {
          formData.append('customizations', JSON.stringify(productData.customizations));
        }

        const variantsData = productData.variants.map(v => ({
          sku: v.sku,
          production_cost: Number(v.production_cost), // Asegurar número
          profit_margin: Number(v.profit_margin), // Asegurar número
          stock: Number(v.stock), // Asegurar número
          stock_threshold: v.stock_threshold !== undefined ? Number(v.stock_threshold) : 10,
          attributes: v.attributes || [],
          customizations: productData.product_type !== 'Existencia' && v.customizations ? v.customizations : undefined
        }));
        formData.append('variants', JSON.stringify(variantsData));

        productData.variants.forEach((variant, index) => {
          variant.images.forEach((image, imgIndex) => {
            formData.append(`variants[${index}][images]`, image, `${variant.sku}-${imgIndex + 1}-${image.name}`);
          });
        });

        const formDataEntries: Record<string, any> = {};
        formData.forEach((value, key) => {
          formDataEntries[key] = value;
        });
        console.log('Datos enviados en FormData (creación):', formDataEntries);

        return this.http.post<CreatedProductResponse>(this.apiUrl, formData, {
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
        const headers = new HttpHeaders({
          'x-csrf-token': csrfToken,
          'Content-Type': 'application/json'
        });

        // Construir el payload JSON, enviando variants y customizations como strings JSON
        const payload = {
          name: productData.name,
          description: productData.description || null,
          product_type: productData.product_type,
          category_id: Number(productData.category_id),
          collaborator_id: productData.collaborator_id ? Number(productData.collaborator_id) : null,
          standard_delivery_days: Number(productData.standard_delivery_days),
          urgent_delivery_enabled: Boolean(productData.urgent_delivery_enabled),
          urgent_delivery_days: productData.urgent_delivery_enabled && productData.urgent_delivery_days ? Number(productData.urgent_delivery_days) : null,
          urgent_delivery_cost: productData.urgent_delivery_enabled && productData.urgent_delivery_cost ? Number(productData.urgent_delivery_cost) : null,
          customizations: productData.product_type !== 'Existencia' && productData.customizations ? JSON.stringify(productData.customizations.map(cust => ({
            type: cust.type,
            description: cust.description
          }))) : null,
          variants: JSON.stringify(productData.variants.map(v => ({
            variant_id: v.variant_id ? Number(v.variant_id) : undefined,
            sku: v.sku,
            production_cost: Number(v.production_cost),
            profit_margin: Number(v.profit_margin),
            stock: Number(v.stock),
            stock_threshold: v.stock_threshold ? Number(v.stock_threshold) : undefined,
            attributes: v.attributes ? v.attributes.map(attr => ({
              attribute_id: Number(attr.attribute_id),
              value: attr.value
            })) : [],
            imagesToDelete: v.imagesToDelete ? v.imagesToDelete.map(id => Number(id)) : []
          })))
        };

        console.log('Datos enviados en JSON (actualización):', payload);

        return this.http.patch<UpdateProductResponse>(`${this.apiUrl}/${productId}`, payload, {
          headers,
          withCredentials: true
        });
      })
    );
  }

  deleteVariant(productId: number, variantIds: number[]): Observable<DeleteVariantResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders()
          .set('x-csrf-token', csrfToken)
          .set('Content-Type', 'application/json');
        const body = { variant_ids: variantIds };
        return this.http.delete<DeleteVariantResponse>(`${this.apiUrl}/${productId}/variants`, {
          headers,
          body,
          withCredentials: true
        });
      })
    );
  }

  getStockVariants(
    page: number = 1,
    pageSize: number = 10,
    categoryId?: number,
    stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'no_stock'
  ): Observable<StockVariantsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (categoryId) params = params.set('category_id', categoryId.toString());
    if (stockStatus) params = params.set('stock_status', stockStatus);

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

  getAllPriceVariants(
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    categoryId?: number,
    productType?: 'Existencia' | 'semi_personalizado' | 'personalizado',
    sortBy?: 'sku' | 'calculated_price' | 'production_cost' | 'profit_margin' | 'product_name' | 'updated_at',
    sortOrder?: 'ASC' | 'DESC'
  ): Observable<PriceVariantsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', pageSize.toString());
    if (search) params = params.set('search', search);
    if (categoryId) params = params.set('category_id', categoryId.toString());
    if (productType) params = params.set('product_type', productType);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (sortOrder) params = params.set('sortOrder', sortOrder);

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<PriceVariantsResponse>(`${this.apiUrl}/price`, {
          headers,
          params,
          withCredentials: true
        });
      })
    );
  }

  getPriceVariantById(variantId: number): Observable<PriceVariantResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<PriceVariantResponse>(`${this.apiUrl}/price/${variantId}`, {
          headers,
          withCredentials: true
        });
      })
    );
  }

  updatePrice(variantId: number, priceData: UpdatePriceRequest): Observable<UpdatePriceResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders()
          .set('x-csrf-token', csrfToken)
          .set('Content-Type', 'application/json');
        return this.http.put<UpdatePriceResponse>(`${this.apiUrl}/price/${variantId}`, priceData, {
          headers,
          withCredentials: true
        });
      })
    );
  }

  getPriceHistoryByVariantId(variantId: number): Observable<PriceHistoryResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<PriceHistoryResponse>(`${this.apiUrl}/price/history/${variantId}`, {
          headers,
          withCredentials: true
        });
      })
    );
  }

  batchUpdatePrices(priceData: BatchUpdatePriceRequest): Observable<BatchUpdatePriceResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders()
          .set('x-csrf-token', csrfToken)
          .set('Content-Type', 'application/json');
        return this.http.put<BatchUpdatePriceResponse>(`${this.apiUrl}/price/batch-update`, priceData, {
          headers,
          withCredentials: true
        });
      })
    );
  }

  batchUpdatePricesIndividual(priceData: BatchUpdatePriceIndividualRequest): Observable<BatchUpdatePriceIndividualResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders()
          .set('x-csrf-token', csrfToken)
          .set('Content-Type', 'application/json');
        return this.http.put<BatchUpdatePriceIndividualResponse>(`${this.apiUrl}/price/batch-update-individual`, priceData, {
          headers,
          withCredentials: true
        });
      })
    );
  }
}