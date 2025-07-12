import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { CartService, CartResponse, CartItem } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { ToastService } from '../../services/toastService';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';
import { UserService } from '../../services/user.service';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  providers: [DatePipe]
})
export class CheckoutComponent implements OnInit {
  cart: CartResponse = { items: [], total: 0, total_urgent_delivery_fee: 0, estimated_delivery_days: 0, promotions: [] };
  isLoading: boolean = false;
  shippingCost: number = 0;
  orderForm: FormGroup;
  address: any;
  shippingOptions: any[] = [];

  constructor(
    private userService: UserService,
    private cartService: CartService,
    private orderService: OrderService,
    private toastService: ToastService,
    private router: Router,
    private datePipe: DatePipe,
    private fb: FormBuilder
  ) {
    this.orderForm = this.fb.group({
      payment_method: ['mercado_pago', Validators.required],
      address_id: [null, Validators.required],
      coupon_code: [''],
      delivery_option: ['Recoger en Tienda', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCart();
    this.loadAddresses();
    this.loadShippingOptions();
  }
  //opciones de envío de carga
  loadShippingOptions(): void {
    this.isLoading = true;
    this.orderService.getShippingOptions().subscribe({
      next: (response) => {
        this.shippingOptions = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Error al cargar opciones de envío.';
        this.toastService.showToast(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }
  //carga carrito
  loadCart(): void {
    this.isLoading = true;
    this.cartService.loadCart().subscribe({
      next: (response) => {
        this.cart = response;
        this.isLoading = false;
        if (this.cart.items.length === 0) {
          this.toastService.showToast('El carrito está vacío. Por favor, añade productos.', 'error');
          this.router.navigate(['/cart']);
        }
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'No se pudo cargar el carrito.';
        this.toastService.showToast(errorMessage, 'error');
        this.isLoading = false;
        this.router.navigate(['/cart']);
      }
    });
  }
  //carga info de user
  loadAddresses(): void {
    this.isLoading = true;
    this.userService.getProfile().subscribe({
      next: (response: any) => {
        this.address = response.address;
        this.orderForm.patchValue({
          address_id: this.address.address_id
        });
        this.isLoading = false;
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Error al cargar la dirección.';
        this.toastService.showToast(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  createOrder() {
    if (this.orderForm.invalid) {
      return;
    }
    this.isLoading = true;
    this.orderService.createOrder(this.orderForm.value).subscribe({
      next: (response) => {
        console.log('Orden enviando.', response);
        this.toastService.showToast('Orden exitosa.', 'success');
        this.isLoading = false;
        this.router.navigate(['/order-confirmation', response.data.order_id]);
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Error al crear la orden';
        this.toastService.showToast(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  calculateTotals(): { subtotal: number; discount: number; total_urgent_cost: number; shipping_cost: number; total: number } {
    const subtotal = this.cart.total;
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