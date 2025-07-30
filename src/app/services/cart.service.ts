import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError} from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { AuthService } from './auth.service';
import { environment } from '../environments/config';

// Interfaces para tipar las respuestas del backend
export interface CartItem {
  cart_detail_id: number;
  product_id: number;
  product_name: string;
  variant_id: number;
  variant_sku: string;
  calculated_price: number;
  quantity: number;
  unit_price: number;
  urgent_delivery_fee: number;
  subtotal: number;
  unit_measure: string;
  category_id: number;
  is_urgent: boolean;
  urgent_delivery_cost: number;
  urgent_delivery_enabled: boolean; // Nuevo campo
  standard_delivery_days: number;
  urgent_delivery_days: number | null;
  customization: { option_id: number; option_type: string; description: string } | null;
  images: { image_url: string; order: number }[];
  applicable_promotions: {
    promotion_id: number;
    name: string;
    discount_value: number;
    promotion_type: string;
  }[];
  isUpdating?: boolean;
  updateError?: string | null;
}

export interface Promotion {
  promotion_id: number;
  name: string;
  promotion_type: string;
  discount_value: string;
  is_applicable: boolean;
  progress_message: string;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
  total_urgent_delivery_fee: number;
  estimated_delivery_days: number;
  promotions: Promotion[];
}

export interface AddToCartRequest {
  product_id: number;
  variant_id: number;
  quantity: number;
  option_id?: number;
  is_urgent: boolean;
}

export interface UpdateQuantityRequest {
  cart_detail_id: number;
  quantity: number;
  is_urgent: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.baseUrl}/cart`;
  private cartItemCountSubject = new BehaviorSubject<number>(0);
  cartItemCount$: Observable<number> = this.cartItemCountSubject.asObservable();

  constructor(
    private csrfService: CsrfService,
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Escuchar eventos de login y logout para actualizar el carrito
    this.authService.onLogin().subscribe(() => this.loadInitialCartCount());
    this.authService.onLogout().subscribe(() => this.resetCartCount());
    // Cargar el conteo inicial solo si está autenticado
    if (this.authService.isLoggedIn()) {
      this.loadInitialCartCount();
    } else {
      this.cartItemCountSubject.next(0);
    }
  }

  // Reiniciar el conteo del carrito a 0 (usado en logout o no autenticado)
  private resetCartCount(): void {
    this.cartItemCountSubject.next(0);
  }

  // Cargar el número inicial de ítems en el carrito
  private loadInitialCartCount(): void {
    this.loadCart().subscribe({
      next: (response: CartResponse) => {
        const count = response.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        this.cartItemCountSubject.next(count);
      },
      error: (error) => {
        console.error('Error al cargar el conteo inicial del carrito:', error);
        this.cartItemCountSubject.next(0);
      }
    });
  }

  // Añadir producto al carrito
  addToCart(data: AddToCartRequest): Observable<any> {
    if (!this.authService.isLoggedIn()) {
      return of({ error: 'Usuario no autenticado' });
    }
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post<any>(`${this.apiUrl}/add`, data, { headers, withCredentials: true }).pipe(
          tap(() => {
            const quantity = data.quantity || 1;
            const currentCount = this.cartItemCountSubject.getValue();
            this.cartItemCountSubject.next(currentCount + quantity);
          }),
          catchError(error => {
            console.error('Error al añadir al carrito:', error);
            return of({ error: error.error?.message || 'No se pudo añadir al carrito' });
          })
        );
      })
    );
  }

  // Obtener detalles del carrito
  loadCart(): Observable<CartResponse> {
    if (!this.authService.isLoggedIn()) {
      return of({ items: [], total: 0, total_urgent_delivery_fee: 0, estimated_delivery_days: 0, promotions: [] });
    }
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<CartResponse>(`${this.apiUrl}`, { headers, withCredentials: true }).pipe(
          tap((response: CartResponse) => {
            const count = response.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            this.cartItemCountSubject.next(count);
          }),
          catchError(error => {
            console.error('Error al cargar el carrito:', error);
            return of({ items: [], total: 0, total_urgent_delivery_fee: 0, estimated_delivery_days: 0, promotions: [] });
          })
        );
      })
    );
  }

  // Actualizar cantidad de un ítem
updateQuantity(data: UpdateQuantityRequest, oldQuantity: number): Observable<any> {
  if (!this.authService.isLoggedIn()) {
    return throwError(() => new Error('Usuario no autenticado'));
  }
  
  return this.csrfService.getCsrfToken().pipe(
    switchMap(csrfToken => {
      const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
      return this.http.put<any>(`${this.apiUrl}/update`, data, { headers, withCredentials: true }).pipe(
        tap(() => {
          const newQuantity = data.quantity || 0;
          const quantityChange = newQuantity - oldQuantity;
          const currentCount = this.cartItemCountSubject.getValue();
          this.cartItemCountSubject.next(currentCount + quantityChange);
        }),
        catchError(error => {
          console.error('Error al actualizar la cantidad:', error);
          return throwError(() => ({
            error: error.error?.message || error.message || 'No se pudo actualizar la cantidad',
            status: error.status
          }));
        })
      );
    }),
    catchError(error => {
      return throwError(() => error);
    })
  );
}

  // Eliminar un ítem del carrito
  removeItem(cartDetailId: number, quantityToRemove: number): Observable<any> {
    if (!this.authService.isLoggedIn()) {
      return of({ error: 'Usuario no autenticado' });
    }
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.delete<any>(`${this.apiUrl}/remove/${cartDetailId}`, { headers, withCredentials: true }).pipe(
          tap(() => {
            const currentCount = this.cartItemCountSubject.getValue();
            this.cartItemCountSubject.next(currentCount - quantityToRemove);
          }),
          catchError(error => {
            console.error('Error al eliminar el ítem:', error);
            return of({ error: error.error?.message || 'No se pudo eliminar el ítem' });
          })
        );
      })
    );
  }
}