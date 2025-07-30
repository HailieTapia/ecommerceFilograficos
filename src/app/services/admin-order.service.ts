import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { CsrfService } from './csrf.service';
import { environment } from '../environments/config';

// Interfaz para los detalles de un ítem de la orden
export interface AdminOrderDetail {
  order_detail_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_applied: number;
  unit_measure: number;
  is_urgent: boolean;
  additional_cost: number;
}

// Interfaz para la dirección
export interface AdminAddress {
  address_id: number;
  street: string;
  city: string;
  state: string;
  postal_code: string;
}

// Interfaz para el historial de la orden
export interface AdminOrderHistory {
  history_id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  date: string;
}

// Interfaz para una orden individual
export interface AdminOrder {
  order_id: number;
  user_id: number;
  customer_name: string;
  total: number;
  discount: number;
  shipping_cost: number;
  payment_status: 'pending' | 'validated' | 'failed';
  payment_method: string;
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered';
  estimated_delivery_date: string;
  delivery_option: 'home_delivery' | 'pickup_point' | 'store_pickup' | null;
  created_at: string;
  order_details: AdminOrderDetail[];
  address: AdminAddress | null;
  history: AdminOrderHistory[];
}

// Interfaz para el resumen estadístico
export interface AdminOrderSummary {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
}

// Interfaz para la respuesta de la lista de órdenes (getOrdersForAdmin)
export interface AdminOrdersResponse {
  success: boolean;
  message: string;
  data: {
    orders: AdminOrder[];
    ordersByDay: { [date: string]: AdminOrder[] };
    pagination: {
      totalOrders: number;
      currentPage: number;
      pageSize: number;
      totalPages: number;
    };
    summary: AdminOrderSummary;
  };
}

// Interfaz para la respuesta de los detalles de una orden (getOrderDetailsByIdForAdmin)
export interface AdminOrderResponse {
  success: boolean;
  message: string;
  data: AdminOrder;
}

// Interfaz para la solicitud de actualización de estado
export interface UpdateOrderStatusRequest {
  newStatus: 'pending' | 'processing' | 'shipped' | 'delivered';
}

// Interfaz para la respuesta de actualización de estado (updateOrderStatus)
export interface UpdateOrderStatusResponse {
  success: boolean;
  message: string;
  data: AdminOrder;
}

// Interfaz para la respuesta del resumen (getOrderSummary)
export interface AdminOrderSummaryResponse {
  success: boolean;
  message: string;
  data: AdminOrderSummary;
}

// Interfaz para la respuesta de órdenes por fecha (getOrdersByDateForAdmin)
export interface AdminOrdersByDateResponse {
  success: boolean;
  message: string;
  data: AdminOrder[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminOrderService {
  private apiUrl = `${environment.baseUrl}/admin/orders`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  // Manejo de errores
  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Error en la comunicación con el servidor';
    if (error.status === 400 && error.error?.errors) {
      message = error.error.errors.map((err: any) => `${err.path}: ${err.msg}`).join('; ');
    } else if (error.status === 404) {
      message = error.error?.message || 'Orden no encontrada';
    } else if (error.status === 500) {
      message = error.error?.message || 'Error interno del servidor';
    }
    console.error('Error en la solicitud:', error);
    return throwError(() => new Error(message));
  }

  // Obtener la lista paginada de órdenes con filtros avanzados
  getOrders(
    page: number = 1,
    pageSize: number = 20,
    searchTerm: string = '',
    statusFilter: 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' = 'all',
    dateFilter: string = '',
    dateField: 'delivery' | 'creation' = 'delivery',
    paymentMethod: string = '',
    deliveryOption: string = '',
    minTotal: number | null = null,
    maxTotal: number | null = null,
    isUrgent: boolean | null = null
  ): Observable<AdminOrdersResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        let params = new HttpParams()
          .set('page', page.toString())
          .set('pageSize', pageSize.toString())
          .set('statusFilter', statusFilter)
          .set('dateField', dateField);

        if (searchTerm.trim()) params = params.set('searchTerm', searchTerm.trim());
        if (dateFilter.trim()) params = params.set('dateFilter', dateFilter.trim());
        if (paymentMethod) params = params.set('paymentMethod', paymentMethod);
        if (deliveryOption) params = params.set('deliveryOption', deliveryOption);
        if (minTotal !== null) params = params.set('minTotal', minTotal.toString());
        if (maxTotal !== null) params = params.set('maxTotal', maxTotal.toString());
        if (isUrgent !== null) params = params.set('isUrgent', isUrgent.toString());

        return this.http.get<AdminOrdersResponse>(this.apiUrl, { headers, params, withCredentials: true });
      }),
      catchError(this.handleError)
    );
  }

  // Obtener órdenes por fecha específica
  getOrdersByDate(date: string, dateField: 'delivery' | 'creation'): Observable<AdminOrdersByDateResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const params = new HttpParams()
          .set('date', date)
          .set('dateField', dateField);

        return this.http.get<AdminOrdersByDateResponse>(`${this.apiUrl}/by-date`, { headers, params, withCredentials: true });
      }),
      catchError(this.handleError)
    );
  }

  // Obtener los detalles de una orden específica por ID
  getOrderById(orderId: number): Observable<AdminOrderResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<AdminOrderResponse>(`${this.apiUrl}/${orderId}`, { headers, withCredentials: true });
      }),
      catchError(this.handleError)
    );
  }

  // Actualizar el estado de una orden
  updateOrderStatus(orderId: number, newStatus: UpdateOrderStatusRequest): Observable<UpdateOrderStatusResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put<UpdateOrderStatusResponse>(`${this.apiUrl}/${orderId}/status`, newStatus, { headers, withCredentials: true });
      }),
      catchError(this.handleError)
    );
  }

  // Obtener el resumen de estadísticas de órdenes
  getOrderSummary(): Observable<AdminOrderSummaryResponse> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<AdminOrderSummaryResponse>(`${this.apiUrl}/summary`, { headers, withCredentials: true });
      }),
      catchError(this.handleError)
    );
  }
}