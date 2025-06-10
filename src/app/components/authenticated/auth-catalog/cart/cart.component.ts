import { Component, OnInit } from '@angular/core';
import { CartService, CartResponse, CartItem, Promotion } from '../../../services/cart.service';
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
  styleUrls: ['./cart.component.css'] // Asegúrate de que sea styleUrls, plural
})
export class CartComponent implements OnInit {
  cart: CartResponse = { items: [], total: 0, promotions: [] };
  subtotal: number = 0;
  discount: number = 0;
  total: number = 0;
  isLoading: boolean = false;
  orderCountPromotion: Promotion | null = null;

  constructor(
    private cartService: CartService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.isLoading = true;
    this.cartService.loadCart().subscribe({
      next: (response: CartResponse) => {
        this.cart = response;
        // Encontrar la promoción de conteo de pedidos
        this.orderCountPromotion = this.cart.promotions.find(
          (promo) => promo.promotion_type === 'order_count_discount'
        ) || null;
        this.calculateTotals();
        this.isLoading = false;
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'No se pudo cargar el carrito. Por favor, intenta de nuevo.';
        this.toastService.showToast(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  calculateTotals(): void {
    // Calcular subtotal (suma de item.subtotal)
    this.subtotal = this.cart.items.reduce((sum, item) => sum + item.subtotal, 0);

    // Calcular descuento total basado en applicable_promotions
    this.discount = this.cart.items.reduce((totalDiscount, item) => {
      const itemDiscount = item.applicable_promotions.reduce(
        (sum, promo) => sum + item.subtotal * (promo.discount_value / 100),
        0
      );
      return totalDiscount + itemDiscount;
    }, 0);

    // Calcular total final
    this.total = Math.max(0, this.subtotal - this.discount);
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity < 1) {
      this.removeItem(item.cart_detail_id);
      return;
    }

    const oldQuantity = item.quantity;
    const data = {
      cart_detail_id: item.cart_detail_id,
      quantity: newQuantity
    };

    this.cartService.updateQuantity(data, oldQuantity).subscribe({
      next: () => {
        this.loadCart(); // Recargar el carrito para reflejar cambios en promociones
        this.toastService.showToast('Cantidad actualizada', 'success');
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'No se pudo actualizar la cantidad.';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  removeItem(cartDetailId: number): void {
    const item = this.cart.items.find((i) => i.cart_detail_id === cartDetailId);
    const quantityToRemove = item ? item.quantity : 0;

    this.cartService.removeItem(cartDetailId, quantityToRemove).subscribe({
      next: () => {
        this.loadCart(); // Recargar el carrito
        this.toastService.showToast('Producto eliminado del carrito', 'success');
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'No se pudo eliminar el producto del carrito.';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  proceedToCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  trackByCartDetailId(index: number, item: CartItem): number {
    return item.cart_detail_id;
  }

  // Método auxiliar para obtener la URL de la imagen de forma segura
  getImageUrl(item: CartItem): string {
    return item.images.length > 0 ? item.images[0].image_url : 'https://via.placeholder.com/100?text=No+Image';
  }
}