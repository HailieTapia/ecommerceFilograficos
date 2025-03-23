import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../environments/config';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.baseUrl}/cart`;
  private cartItemCountSubject = new BehaviorSubject<number>(0);
  cartItemCount$: Observable<number> = this.cartItemCountSubject.asObservable();

  constructor(private csrfService: CsrfService, private http: HttpClient) {
    this.loadInitialCartCount();
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
        this.cartItemCountSubject.next(0);
      }
    );
  }

  // Añadir producto al carrito
  addToCart(data: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post<any>(`${this.apiUrl}/add`, data, { headers, withCredentials: true }).pipe(
          tap(() => {
            // Incrementar el contador con la cantidad añadida
            const quantity = data.quantity || 1;
            const currentCount = this.cartItemCountSubject.getValue();
            this.cartItemCountSubject.next(currentCount + quantity);
          })
        );
      })
    );
  }

  // Obtener detalles del carrito
  loadCart(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<any>(`${this.apiUrl}`, { headers, withCredentials: true }).pipe(
          tap((response) => {
            // Aserción de tipo para decirle a TypeScript que response tiene items y total
            const cartResponse = response as { items?: { quantity: number }[]; total?: number };
            const count = cartResponse.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            this.cartItemCountSubject.next(count);
          })
        );
      })
    );
  }

  // Actualizar cantidad de un ítem
  updateQuantity(data: any, oldQuantity: number): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put<any>(`${this.apiUrl}/update`, data, { headers, withCredentials: true }).pipe(
          tap(() => {
            // Actualizar el contador con el cambio en la cantidad
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
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.delete<any>(`${this.apiUrl}/remove/${cartDetailId}`, { headers, withCredentials: true }).pipe(
          tap(() => {
            // Decrementar el contador con la cantidad eliminada
            const currentCount = this.cartItemCountSubject.getValue();
            this.cartItemCountSubject.next(currentCount - quantityToRemove);
          })
        );
      })
    );
  }
}