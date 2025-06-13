import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { CsrfService } from './csrf.service';
import { environment } from '../../environments/config';

// Interfaz para el body de la creación de la orden
export interface OrderCreateRequest {
  address_id?: number | null;
  is_urgent?: boolean;
  payment_method: 'bank_transfer_oxxo' | 'bank_transfer_bbva' | 'bank_transfer' | 'paypal' | 'stripe';
  coupon_code?: string | null;
}

// Interfaz para las instrucciones de pago
export interface PaymentInstructions {
  method: string;
  reference?: string;
  account?: string;
  clabe?: string;
  amount: number;
  instructions: string;
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
  order_detail_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_applied: number;
  unit_measure: number;
  customization?: CustomizationDetail;
}

// Interfaz para la dirección
export interface Address {
  address_id: number;
  street: string;
  city: string;
  state: string;
  postal_code: string;
}

// Interfaz para la respuesta de creación de una orden
export interface OrderCreateResponse {
  success: boolean;
  message: string;
  data: {
    order_id: number;
    total: number;
    payment_instructions: PaymentInstructions;
    status: 'pending' | 'processing' | 'shipped' | 'delivered';
  };
}

// Interfaz para la respuesta de los detalles de una orden (getOrderById)
export interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    order_id: number;
    user_id: number;
    total: number;
    subtotal: number;
    discount: number;
    shipping_cost: number;
    payment_method: string;
    payment_status: 'pending' | 'validated' | 'failed';
    order_status: 'pending' | 'processing' | 'shipped' | 'delivered';
    is_urgent: boolean;
    created_at: string;
    address: Address | null;
    items: OrderDetail[];
    payment_instructions: PaymentInstructions;
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
      order_status: 'pending' | 'processing' | 'shipped' | 'delivered';
      payment_status: 'pending' | 'validated' | 'failed';
      created_at: string;
      items_count: number;
      first_item_name: string;
      city: string | null;
    }[];
    pagination: {
      totalOrders: number;
      currentPage: number;
      pageSize: number;
      totalPages: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.baseUrl}/order`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  // Manejo de errores
  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = error.error?.message || 'Error en la comunicación con el servidor';
    console.error('Error en la solicitud:', error);
    return throwError(() => new Error(message));
  }

  // Crear una nueva orden
  createOrder(orderData: OrderCreateRequest): Observable<OrderCreateResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post<OrderCreateResponse>(
          `${this.apiUrl}/create`,
          orderData,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  // Obtener los detalles de una orden específica
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

  // Obtener la lista paginada de órdenes
  getOrders(page: number = 1, pageSize: number = 10): Observable<OrdersResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<OrdersResponse>(
          `${this.apiUrl}/?page=${page}&pageSize=${pageSize}`,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }
}