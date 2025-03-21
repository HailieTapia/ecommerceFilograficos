import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../environments/config';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.baseUrl}/cart`;
  private cartState = new BehaviorSubject<{ items: any[], totalItems: number }>({ items: [], totalItems: 0 });
  cartState$ = this.cartState.asObservable(); // Observable para que los componentes se suscriban

  constructor(private csrfService: CsrfService, private http: HttpClient) {
    // Cargar el estado inicial del carrito al iniciar el servicio
    this.loadCart().subscribe();
  }

  // Añadir al carrito
  addToCart(item: { product_id: number, variant_id: number, quantity: number, customization_option_id?: number }): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/add`, item, { headers, withCredentials: true }).pipe(
          tap(() => {
            // Después de añadir un producto, recargar el estado del carrito
            this.loadCart().subscribe();
          }),
          catchError(error => {
            console.error('Error al añadir al carrito:', error);
            return throwError(() => new Error(error.error?.message || 'Error al añadir al carrito'));
          })
        );
      })
    );
  }

  // Obtener el estado del carrito desde el backend
  loadCart(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<any>(`${this.apiUrl}`, { headers, withCredentials: true }).pipe(
          tap(response => {
            // Actualizamos el estado del carrito con los datos recibidos
            const cartData = {
              items: response.items || [],
              totalItems: response.items?.reduce((total: number, item: any) => total + item.quantity, 0) || 0
            };
            this.cartState.next(cartData);
          }),
          catchError(error => {
            console.error('Error al cargar el carrito:', error);
            this.cartState.next({ items: [], totalItems: 0 }); // En caso de error, reseteamos el estado
            return throwError(() => new Error(error.error?.message || 'Error al cargar el carrito'));
          })
        );
      })
    );
  }

  // Método para obtener el observable del estado del carrito
  getCartState(): Observable<{ items: any[], totalItems: number }> {
    return this.cartState$;
  }
}