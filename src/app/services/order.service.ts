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
      total_urgent_cost: number;
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

  // Manejo de errores
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

  // Crear una nueva orden
  createOrder(data: any, item?: any): Observable<any> {
    const payload = item ? { ...data, item } : data;
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/create`, payload, { headers, withCredentials: true });
      })
    );
  }

  // Obtener los detalles de una orden específica por ID
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
