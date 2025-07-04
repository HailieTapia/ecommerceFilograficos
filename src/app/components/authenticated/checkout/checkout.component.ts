import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartResponse, CartItem } from '../../services/cart.service';
import { OrderService, OrderCreateRequest, OrderCreateResponse } from '../../services/order.service';
import { ToastService } from '../../services/toastService';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';

interface Address {
  address_id: number;
  street: string;
  city: string;
  state: string;
  postal_code: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  providers: [DatePipe]
})
export class CheckoutComponent implements OnInit {
  cart: CartResponse = { items: [], total: 0, total_urgent_delivery_fee: 0, estimated_delivery_days: 0, promotions: [] };
  addresses: Address[] = [];
  selectedAddressId: number | null = null;
  paymentMethod: 'bank_transfer_oxxo' | 'bank_transfer_bbva' | 'bank_transfer' = 'bank_transfer_bbva';
  isLoading: boolean = false;
  shippingCost: number = 20.00; // Alineado con el backend

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private toastService: ToastService,
    private router: Router,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadCart();
    this.loadAddresses();
  }

  loadCart(): void {
    this.isLoading = true;
    this.cartService.loadCart().subscribe({
      next: (response: CartResponse) => {
        this.cart = response;
        this.isLoading = false;
        if (this.cart.items.length === 0) {
          this.toastService.showToast('El carrito está vacío. Por favor, añade productos.', 'error');
          this.router.navigate(['/cart']);
        }
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || 'No se pudo cargar el carrito.';
        this.toastService.showToast(errorMessage, 'error');
        this.isLoading = false;
        this.router.navigate(['/cart']);
      }
    });
  }

  loadAddresses(): void {
    // TODO: Implementar AddressService para obtener direcciones reales
    // Simulación temporal de direcciones
    this.addresses = [
      { address_id: 8, street: 'Calle Ejemplo 123', city: 'Ciudad', state: 'Estado', postal_code: '12345' }
    ];
    this.selectedAddressId = this.addresses.length > 0 ? this.addresses[0].address_id : null;
  }

  createOrder(): void {
    if (!this.selectedAddressId) {
      this.toastService.showToast('Por favor, selecciona una dirección.', 'error');
      return;
    }

    const orderData: OrderCreateRequest = {
      address_id: this.selectedAddressId,
      payment_method: this.paymentMethod,
      delivery_option: null // Placeholder para opciones de envío
    };

    this.isLoading = true;
    this.orderService.createOrder(orderData).subscribe({
      next: (response: OrderCreateResponse) => {
        this.isLoading = false;
        const { order_id, total_urgent_cost, estimated_delivery_date } = response.data;
        this.toastService.showToast(
          `Orden creada con éxito. ID: ${order_id}${total_urgent_cost > 0 ? ` (Costo urgente: $${total_urgent_cost.toFixed(2)})` : ''}`,
          'success'
        );
        this.router.navigate(['/order-confirmation', order_id], {
          state: { total_urgent_cost, estimated_delivery_date }
        });
      },
      error: (error: any) => {
        this.isLoading = false;
        const errorMessage = error?.message || 'Error al crear la orden.';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  calculateTotals(): { subtotal: number; discount: number; total_urgent_cost: number; shipping_cost: number; total: number } {
    const subtotal = this.cart.total; // Total del carrito (incluye costos urgentes)
    const discount = this.cart.items.reduce((totalDiscount: number, item: CartItem) => {
      const itemDiscount = item.applicable_promotions.reduce(
        (sum: number, promo: any) => sum + item.subtotal * (promo.discount_value / 100),
        0
      );
      return totalDiscount + itemDiscount;
    }, 0);
    const total_urgent_cost = this.cart.total_urgent_delivery_fee || 0;
    const shipping_cost = this.shippingCost;
    const total = Math.max(0, subtotal + shipping_cost - discount);
    return { subtotal, discount, total_urgent_cost, shipping_cost, total };
  }

  isAnyItemUrgent(): boolean {
    return this.cart.items.some(item => item.is_urgent);
  }

  trackByCartDetailId(index: number, item: CartItem): number {
    return item.cart_detail_id;
  }

  getImageUrl(item: CartItem): string {
    return item.images.length > 0 ? item.images[0].image_url : 'https://via.placeholder.com/100?text=No+Image';
  }

  goBackToCart(): void {
    this.router.navigate(['/cart']);
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy', 'es-MX') || date;
  }
}