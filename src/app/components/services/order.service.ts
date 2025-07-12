import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { CsrfService } from './csrf.service';
import { environment } from '../../environments/config';

// Interfaz para el body de la creación de la orden
export interface OrderCreateRequest {
  address_id?: number | null;
  payment_method: 'bank_transfer_oxxo' | 'bank_transfer_bbva' | 'bank_transfer';
  coupon_code?: string | null;
  delivery_option?: 'home_delivery' | 'pickup_point' | 'store_pickup' | null;
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
  status: 'pending' | 'validated' | 'failed';
  amount: number;
  created_at: string | null;
  updated_at: string | null;
  instructions: PaymentInstructions;
}

// Interfaz para la respuesta de creación de una orden
export interface OrderCreateResponse {
  success: boolean;
  message: string;
  data: {
    order_id: number;
    total: number;
    total_urgent_cost: number;
    estimated_delivery_date: string;
    payment_instructions: PaymentInstructions;
    status: 'pending' | 'processing' | 'shipped' | 'delivered';
  };
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
      delivery_option: 'home_delivery' | 'pickup_point' | 'store_pickup' | null;
      total: number;
      subtotal: number;
      discount: number;
      shipping_cost: number;
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
      order_status: 'pending' | 'processing' | 'shipped' | 'delivered';
      payment_status: 'pending' | 'validated' | 'failed';
      created_at: string;
      estimated_delivery_date: string;
      delivery_days: number;
      delivery_option: 'home_delivery' | 'pickup_point' | 'store_pickup' | null;
      total_items: number;
      order_details: OrderDetail[];
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

  constructor(private csrfService: CsrfService, private http: HttpClient) { }

  // Crear una nueva orden
  createOrder(data: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/create`, data, { headers, withCredentials: true });
      })
    );
  }

  // Obtener los detalles de una orden específica por ID
  getOrderById2(id: number): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
      })
    );
  }
  getOrderById(orderId: number): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<any>(
          `${this.apiUrl}/${orderId}`,
          { headers, withCredentials: true }
        );
      }),
    )
  }

  // Obtener la lista paginada de órdenes con filtros opcionales
  getOrders(
    page: number = 1,
    pageSize: number = 10,
    searchTerm: string = '',
    dateFilter: string = ''
  ): Observable<any> {
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

        return this.http.get<any>(
          this.apiUrl,
          { headers, params, withCredentials: true }
        );
      })
    );
  }

  // Función para obtener el perfil del usuario autenticado
  getShippingOptions(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/shippingOptions`, { headers, withCredentials: true });
      })
    );
  }
}