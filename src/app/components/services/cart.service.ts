import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { AuthService } from './auth.service'; // Importar AuthService
import { environment } from '../../environments/config';

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
    private authService: AuthService // Inyectar AuthService
  ) {
    // Escuchar eventos de login y logout para actualizar el carrito
    this.authService.onLogin().subscribe(() => this.loadInitialCartCount());
    this.authService.onLogout().subscribe(() => this.resetCartCount());
    // Cargar el conteo inicial solo si está autenticado
    if (this.authService.isLoggedIn()) {
      this.loadInitialCartCount();
    } else {
      this.cartItemCountSubject.next(0); // Establecer 0 para no autenticados
    }
  }

  // Reiniciar el conteo del carrito a 0 (usado en logout o no autenticado)
  private resetCartCount(): void {
    this.cartItemCountSubject.next(0);
  }

  // Cargar el número inicial de ítems en el carrito
  private loadInitialCartCount(): void {
    this.loadCart().subscribe(
      (response) => {
        const cartResponse = response as { items?: { quantity: number }[] };
        const count = cartResponse.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        this.cartItemCountSubject.next(count);
      },
      (error) => {
        console.error('Error al cargar el conteo inicial del carrito:', error);
        this.cartItemCountSubject.next(0); // En caso de error, establecer 0
      }
    );
  }

  // Añadir producto al carrito
  addToCart(data: any): Observable<any> {
    if (!this.authService.isLoggedIn()) {
      return of({ error: 'Usuario no autenticado' }); // Retornar un Observable con error
    }
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post<any>(`${this.apiUrl}/add`, data, { headers, withCredentials: true }).pipe(
          tap(() => {
            const quantity = data.quantity || 1;
            const currentCount = this.cartItemCountSubject.getValue();
            this.cartItemCountSubject.next(currentCount + quantity);
          })
        );
      }),
      catchError(error => {
        console.error('Error al añadir al carrito:', error);
        return of({ error: 'No se pudo añadir al carrito' });
      })
    );
  }

  // Obtener detalles del carrito
  loadCart(): Observable<any> {
    if (!this.authService.isLoggedIn()) {
      return of({ items: [], total: 0 }); // Retornar carrito vacío para no autenticados
    }
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<any>(`${this.apiUrl}`, { headers, withCredentials: true }).pipe(
          tap((response) => {
            const cartResponse = response as { items?: { quantity: number }[]; total?: number };
            const count = cartResponse.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            this.cartItemCountSubject.next(count);
          })
        );
      }),
      catchError(error => {
        console.error('Error al cargar el carrito:', error);
        return of({ items: [], total: 0 }); // Retornar carrito vacío en caso de error
      })
    );
  }

  // Actualizar cantidad de un ítem
  updateQuantity(data: any, oldQuantity: number): Observable<any> {
    if (!this.authService.isLoggedIn()) {
      return of({ error: 'Usuario no autenticado' });
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
          })
        );
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
          })
        );
      })
    );
  }
}