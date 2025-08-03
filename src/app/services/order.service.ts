import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { CsrfService } from './csrf.service';
import { environment } from '../environments/config';

// Interfaz para las instrucciones de pago
export interface PaymentInstructions {
  method: string;
  reference?: string;
  account?: string;
  clabe?: string;
  amount: number;
  instructions: string;
  payment_url?: string;
}

// Interfaz para los detalles de personalización
export interface CustomizationDetail {
  customization_id: number;
  content?: string;
  file_url?: string;
  comments?: string;
}

// Interfaz para los detalles de un ítem de la orden
export interface OrderDetail {
  detail_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_applied: number;
  unit_measure: number;
  is_urgent: boolean;
  additional_cost: number;
  product_image: string;
  customization?: CustomizationDetail | null;
}

// Interfaz para la dirección
export interface Address {
  address_id: number;
  street: string;
  city: string;
  state: string;
  postal_code: string;
}

// Interfaz para el historial de la orden
export interface OrderHistory {
  history_id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  date: string;
}

// Interfaz para el pago
export interface Payment {
  payment_id: number | null;
  method: string;
  status: 'pending' | 'validated' | 'failed' | 'approved' | 'rejected' | 'in_process';
  amount: number;
  created_at: string | null;
  updated_at: string | null;
  instructions: PaymentInstructions;
}

// Interfaz para los totales precalculados
export interface PrecalculatedTotals {
  total: number;
  total_discount: number;
  shipping_cost: number;
  total_urgent_delivery_fee: number;
  estimated_delivery_days: number;
  applied_promotions: { name: string; discount_value: number; coupon_code?: string }[];
}

// Interfaz para la respuesta de los detalles de una orden (getOrderById)
export interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    order: {
      order_id: number;
      status: 'pending' | 'processing' | 'shipped' | 'delivered';
      created_at: string;
      estimated_delivery_date: string;
      delivery_days: number;
      delivery_option: 'Entrega a Domicilio' | 'Puntos de Entrega' | 'Recoger en Tienda' | null;
      total: number;
      subtotal: number;
      discount: number;
      total_discount: number;
      shipping_cost: number;
      total_urgent_cost: number;
      coupon_code: string | null;
      applied_promotions: { name: string; discount_value: number; coupon_code?: string }[];
    };
    items: OrderDetail[];
    address: Address | null;
    payment: Payment;
    history: OrderHistory[];
  };
}

// Interfaz para la respuesta de la lista de órdenes (getOrders)
export interface OrdersResponse {
  success: boolean;
  message: string;
  data: {
    orders: {
      order_id: number;
      total: number;
      total_discount: number;
      order_status: 'pending' | 'processing' | 'shipped' | 'delivered';
      payment_status: 'pending' | 'validated' | 'failed';
      created_at: string;
      estimated_delivery_date: string;
      delivery_days: number;
      delivery_option: 'Entrega a Domicilio' | 'Puntos de Entrega' | 'Recoger en Tienda' | null;
      total_items: number;
      order_details: OrderDetail[];
      coupon_code: string | null;
    }[];
    pagination: {
      totalOrders: number;
      currentPage: number;
      pageSize: number;
      totalPages: number;
    };
  };
}

// Interfaz para la solicitud de creación de orden
export interface CreateOrderRequest {
  payment_method: string;
  delivery_option: 'Entrega a Domicilio' | 'Puntos de Entrega' | 'Recoger en Tienda';
  address_id?: number;
  coupon_code?: string;
  item?: {
    product_id: number;
    variant_id: number;
    quantity: number;
    option_id?: number;
    is_urgent: boolean;
  };
  precalculatedTotals?: PrecalculatedTotals;
}

// Interfaz para la respuesta de creación de orden
export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: {
    order_id: number;
    total: number;
    total_urgent_cost: number;
    discount: number;
    shipping_cost: number;
    estimated_delivery_date: string;
    payment_instructions: PaymentInstructions;
    status: string;
    coupon_code: string | null;
    applied_promotions: { name: string; discount_value: number; coupon_code?: string }[];
  };
}

// Interfaz para la respuesta de aplicar cupón
export interface ApplyCouponResponse {
  success: boolean;
  message: string;
  data: PrecalculatedTotals;
}

// Interfaz para las opciones de envío
export interface ShippingOption {
  id: string;
  name: string;
  cost: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.baseUrl}/order`;
  private couponApiUrl = `${environment.baseUrl}/order/coupons`;

  constructor(private csrfService: CsrfService, private http: HttpClient) { }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Error en la comunicación con el servidor';
    if (error.status === 400) {
      message = error.error?.message || 'Solicitud inválida';
    } else if (error.status === 404) {
      message = error.error?.message || 'Orden no encontrada';
    } else if (error.status === 500) {
      message = error.error?.message || 'Error interno del servidor';
    }
    console.error('Error en la solicitud:', error);
    return throwError(() => new Error(message));
  }

  applyCoupon(coupon_code: string, delivery_option: string, item?: CreateOrderRequest['item'], cart?: any): Observable<ApplyCouponResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const body = { coupon_code, delivery_option, item, cart };
        return this.http.post<ApplyCouponResponse>(
          `${this.couponApiUrl}/apply`,
          body,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  createOrder(data: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post<CreateOrderResponse>(
          `${this.apiUrl}/create`,
          data,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  getOrderById(orderId: number): Observable<OrderResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<OrderResponse>(
          `${this.apiUrl}/${orderId}`,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  getOrders(
    page: number = 1,
    pageSize: number = 10,
    searchTerm: string = '',
    dateFilter: string = ''
  ): Observable<OrdersResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        let params = new HttpParams()
          .set('page', page.toString())
          .set('pageSize', pageSize.toString());

        if (searchTerm.trim()) {
          params = params.set('searchTerm', searchTerm.trim());
        }

        if (dateFilter.trim()) {
          params = params.set('dateFilter', dateFilter.trim());
        }

        return this.http.get<OrdersResponse>(
          this.apiUrl,
          { headers, params, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  getShippingOptions(): Observable<{ success: boolean; data: ShippingOption[] }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<{ success: boolean; data: ShippingOption[] }>(
          `${this.apiUrl}/shippingOptions`,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }
}