import { Component, OnInit } from '@angular/core';
import { CartService } from '../../../services/cart.service';
import { ToastService } from '../../../services/toastService';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SpinnerComponent } from '../../../reusable/spinner/spinner.component';
@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [SpinnerComponent, CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  totalItems: number = 0;
  subtotal: number = 0;
  total: number = 0;
  isLoading: boolean = false;

  constructor(
    private cartService: CartService,
    private toastService: ToastService,
    private router: Router // Añadí el Router que faltaba
  ) { }

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.isLoading = true;
    this.cartService.loadCart().subscribe(
      (response) => {
        // Aserción de tipo para decirle a TypeScript que response tiene items y total
        const cartResponse = response as { items?: any[]; total?: number };
        this.cartItems = cartResponse.items || [];
        this.totalItems = this.cartItems.length;
        this.total = cartResponse.total || 0; // Usar el total del backend
        this.calculateTotals();
        this.isLoading = false;
      },
      (error) => {
        const errorMessage = error?.error?.message || 'No se pudo cargar el carrito. Por favor, intenta de nuevo.';
        this.toastService.showToast(errorMessage, 'error');
        this.isLoading = false;
      }
    );
  }
  calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    this.total = this.subtotal; // Ajusta si hay impuestos o descuentos
  }
  updateQuantity(item: any, newQuantity: number): void {
    if (newQuantity < 1) {
      this.removeItem(item.cart_detail_id);
      return;
    }

    const oldQuantity = item.quantity;
    const data = {
      cart_detail_id: item.cart_detail_id,
      quantity: newQuantity
    };

    this.cartService.updateQuantity(data, oldQuantity).subscribe(
      (response) => {
        item.quantity = newQuantity;
        item.subtotal = item.calculated_price * newQuantity;
        this.calculateTotals();
        this.toastService.showToast('Cantidad actualizada', 'success');
      },
      (error) => {
        const errorMessage = error?.error?.message || 'No se pudo actualizar la cantidad.';
        this.toastService.showToast(errorMessage, 'error');
      }
    );
  }
  removeItem(cartDetailId: number): void {
    const item = this.cartItems.find((i: any) => i.cart_detail_id === cartDetailId);
    const quantityToRemove = item ? item.quantity : 0;

    this.cartService.removeItem(cartDetailId, quantityToRemove).subscribe(
      (response) => {
        this.cartItems = this.cartItems.filter((i: any) => i.cart_detail_id !== cartDetailId);
        this.totalItems = this.cartItems.length;
        this.calculateTotals();
        this.toastService.showToast('Producto eliminado del carrito', 'success');
      },
      (error) => {
        const errorMessage = error?.error?.message || 'No se pudo eliminar el producto del carrito.';
        this.toastService.showToast(errorMessage, 'error');
      }
    );
  }
}