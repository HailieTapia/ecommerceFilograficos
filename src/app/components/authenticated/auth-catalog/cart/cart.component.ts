import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../services/toastService';
import { CsrfService } from '../../../services/csrf.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/config';
import { switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: any[] = [];
  totalItems: number = 0;
  subtotal: number = 0;
  tax: number = 0; 
  total: number = 0;
  private cartSubscription!: Subscription;
  private apiUrl = `${environment.baseUrl}/cart`;

  constructor(
    private cartService: CartService,
    private toastService: ToastService,
    private router: Router,
    private csrfService: CsrfService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Suscribirse al estado del carrito
    this.cartSubscription = this.cartService.getCartState().subscribe(cartState => {
      this.cartItems = cartState.items;
      this.totalItems = cartState.totalItems;
      this.calculateSummary();
    });
  }

  // Calcular el resumen del carrito (subtotal, impuestos, total)
  calculateSummary(): void {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    this.tax = this.subtotal * 0.1; // Ejemplo: 10% de impuestos, ajusta según tus necesidades
    this.total = this.subtotal + this.tax;
  }

  // Actualizar la cantidad de un ítem
  updateQuantity(item: any, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeItem(item.cart_detail_id);
      return;
    }

    this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put(`${this.apiUrl}/update`, 
          { cart_detail_id: item.cart_detail_id, quantity: newQuantity },
          { headers, withCredentials: true }
        );
      })
    ).subscribe({
      next: () => {
        this.cartService.loadCart().subscribe(); // Recargar el carrito después de actualizar
        this.toastService.showToast('Cantidad actualizada exitosamente', 'success');
      },
      error: (error) => {
        this.toastService.showToast(error.error?.message || 'Error al actualizar la cantidad', 'error');
      }
    });
  }

  // Eliminar un ítem del carrito
  removeItem(cartDetailId: number): void {
    this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.delete(`${this.apiUrl}/remove/${cartDetailId}`, { headers, withCredentials: true });
      })
    ).subscribe({
      next: () => {
        this.cartService.loadCart().subscribe(); // Recargar el carrito después de eliminar
        this.toastService.showToast('Producto eliminado del carrito', 'success');
      },
      error: (error) => {
        this.toastService.showToast(error.error?.message || 'Error al eliminar el producto', 'error');
      }
    });
  }

  // Proceder al checkout
  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      this.toastService.showToast('El carrito está vacío', 'error');
      return;
    }
    this.router.navigate(['/checkout']);
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }
}