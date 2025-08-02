import { Component, OnInit } from '@angular/core';
import { CartService, CartResponse, CartItem, CartPromotion } from '../../../services/cart.service';
import { ToastService } from '../../../services/toastService';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';
import { RecommendedProductsComponent } from '../recommended-products/recommended-products.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [SpinnerComponent, CommonModule, FormsModule, RouterModule, RecommendedProductsComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart: CartResponse = { 
    items: [], 
    total: 0, 
    total_urgent_delivery_fee: 0, 
    estimated_delivery_days: 0, 
    promotions: [], 
    total_discount: 0, 
    coupon_code: null 
  };
  subtotal: number = 0;
  discount: number = 0;
  total: number = 0;
  totalUrgentDeliveryFee: number = 0;
  isLoading: boolean = false;
  orderCountPromotion: CartPromotion | null = null;
  public quantityChanges = new Subject<{ item: CartItem; newQuantity: number; isUrgent?: boolean }>();

  constructor(
    private cartService: CartService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.quantityChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged((prev, curr) =>
          prev.item.cart_detail_id === curr.item.cart_detail_id &&
          prev.newQuantity === curr.newQuantity &&
          prev.isUrgent === curr.isUrgent
        )
      )
      .subscribe(({ item, newQuantity, isUrgent }) => {
        this.updateQuantity(item, newQuantity, isUrgent);
      });
  }

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.isLoading = true;
    this.cartService.loadCart().subscribe({
      next: (response: CartResponse) => {
        this.cart = response;
        this.orderCountPromotion = this.cart.promotions.find(
          (promo) => promo.coupon_type === 'order_count_discount'
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
    this.subtotal = this.cart.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    this.totalUrgentDeliveryFee = this.cart.total_urgent_delivery_fee || 0;
    this.discount = this.cart.total_discount || 0;
    this.total = Math.max(0, this.subtotal + this.totalUrgentDeliveryFee - this.discount);
  }

  canBeUrgent(item: CartItem): boolean {
    return item.urgent_delivery_enabled;
  }

  updateQuantity(item: CartItem, newQuantity: number, isUrgent?: boolean): void {
    if (newQuantity < 1) {
      this.removeItem(item.cart_detail_id);
      return;
    }

    const oldQuantity = item.quantity;
    const oldIsUrgent = item.is_urgent;
    const oldUrgentFee = item.urgent_delivery_fee;
    const oldSubtotal = item.subtotal;

    const newIsUrgent = isUrgent !== undefined ? isUrgent : item.is_urgent;
    item.quantity = newQuantity;
    item.is_urgent = newIsUrgent;
    item.urgent_delivery_fee = newIsUrgent ? item.urgent_delivery_cost : 0;
    item.subtotal = newQuantity * item.unit_price + item.urgent_delivery_fee;
    this.calculateTotals();

    const data = {
      cart_detail_id: item.cart_detail_id,
      quantity: newQuantity,
      is_urgent: newIsUrgent
    };

    this.cartService.updateQuantity(data, oldQuantity).subscribe({
      next: () => {
        this.toastService.showToast('Carrito actualizado', 'success');
      },
      error: (error) => {
        item.quantity = oldQuantity;
        item.is_urgent = oldIsUrgent;
        item.urgent_delivery_fee = oldUrgentFee;
        item.subtotal = oldSubtotal;
        this.calculateTotals();
        const errorMessage = error?.error?.message || 'No se pudo actualizar el carrito.';
        this.toastService.showToast(errorMessage, 'error');
        console.error('Error al actualizar:', error);
      }
    });
  }

  toggleUrgent(item: CartItem, event?: Event): void {
    const newIsUrgent = event ? (event.target as HTMLInputElement).checked : !item.is_urgent;
    this.updateQuantity(item, item.quantity, newIsUrgent);
  }

  removeItem(cartDetailId: number): void {
    const item = this.cart.items.find((i) => i.cart_detail_id === cartDetailId);
    const quantityToRemove = item ? item.quantity : 0;

    this.cartService.removeItem(cartDetailId, quantityToRemove).subscribe({
      next: () => {
        this.loadCart();
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

  navigateToProduct(productId: number, variantSku: string): void {
    this.router.navigate(['/collection', productId], { queryParams: { variant_sku: variantSku } });
  }

  trackByCartDetailId(index: number, item: CartItem): number {
    return item.cart_detail_id;
  }

  getImageUrl(item: CartItem): string {
    return item.images.length > 0 ? item.images[0].image_url : 'https://via.placeholder.com/100?text=No+Image';
  }
}