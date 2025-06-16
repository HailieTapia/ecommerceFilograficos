import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  cart: CartResponse = { items: [], total: 0,  total_urgent_delivery_fee: 0, estimated_delivery_days: 0, promotions: [] };
  addresses: Address[] = [];
  selectedAddressId: number | null = null;
  isUrgent: boolean = false;
  paymentMethod: 'bank_transfer_oxxo' | 'bank_transfer_bbva' | 'bank_transfer' = 'bank_transfer_bbva';
  isLoading: boolean = false;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private toastService: ToastService,
    private router: Router
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
    // TODO: Implementar un servicio para obtener las direcciones del usuario
    // Ejemplo simulado:
    // this.addressService.getAddresses().subscribe({
    //   next: (addresses) => {
    //     this.addresses = addresses;
    //     this.selectedAddressId = addresses.length > 0 ? addresses[0].address_id : null;
    //   },
    //   error: (error) => {
    //     this.toastService.showToast('No se pudieron cargar las direcciones.', 'error');
    //   }
    // });
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
      is_urgent: this.isUrgent,
      payment_method: this.paymentMethod
    };

    this.isLoading = true;
    this.orderService.createOrder(orderData).subscribe({
      next: (response: OrderCreateResponse) => {
        this.isLoading = false;
        this.toastService.showToast(`Orden creada con éxito. ID: ${response.data.order_id}`, 'success');
        this.router.navigate(['/order-confirmation', response.data.order_id]);
      },
      error: (error: any) => {
        this.isLoading = false;
        const errorMessage = error?.message || 'Error al crear la orden.';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  calculateTotals(): { subtotal: number; discount: number; total: number } {
    const subtotal = this.cart.items.reduce((sum: number, item: CartItem) => sum + item.subtotal, 0);
    const discount = this.cart.items.reduce((totalDiscount: number, item: CartItem) => {
      const itemDiscount = item.applicable_promotions.reduce(
        (sum: number, promo: any) => sum + item.subtotal * (promo.discount_value / 100),
        0
      );
      return totalDiscount + itemDiscount;
    }, 0);
    const total = Math.max(0, subtotal - discount);
    return { subtotal, discount, total };
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
}