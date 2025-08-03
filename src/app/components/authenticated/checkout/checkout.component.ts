import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartResponse, CartItem, CartPromotion } from '../../../services/cart.service';
import { OrderService, CreateOrderRequest, CreateOrderResponse, ShippingOption, PrecalculatedTotals, ApplyCouponResponse } from '../../../services/order.service';
import { ToastService } from '../../../services/toastService';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  providers: [DatePipe, CurrencyPipe]
})
export class CheckoutComponent implements OnInit {
  cart: CartResponse = { 
    items: [], 
    total: 0, 
    total_urgent_delivery_fee: 0, 
    estimated_delivery_days: 0, 
    promotions: [], 
    total_discount: 0, 
    coupon_code: null 
  };
  buyNowItem: CartItem | null = null;
  isLoading: boolean = false;
  shippingCost: number = 0;
  orderForm: FormGroup;
  address: any;
  shippingOptions: ShippingOption[] = [];
  precalculatedTotals: PrecalculatedTotals | null = null;
  couponApplied: boolean = false;

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
      address_id: [null],
      coupon_code: [''],
      delivery_option: ['Recoger en Tienda', Validators.required]
    });

    const navigation = this.router.getCurrentNavigation();
    this.buyNowItem = navigation?.extras?.state ? navigation.extras.state['buyNowItem'] as CartItem : null;
  }

  ngOnInit(): void {
    if (this.buyNowItem) {
      // Modo "Comprar Ahora"
      this.cart = {
        items: [this.buyNowItem],
        total: this.buyNowItem.subtotal,
        total_urgent_delivery_fee: this.buyNowItem.is_urgent ? this.buyNowItem.urgent_delivery_fee : 0,
        estimated_delivery_days: this.buyNowItem.is_urgent ? this.buyNowItem.urgent_delivery_days || this.buyNowItem.standard_delivery_days : this.buyNowItem.standard_delivery_days,
        promotions: [],
        total_discount: 0,
        coupon_code: null
      };
      this.loadAddresses();
      this.loadShippingOptions();
    } else {
      // Modo carrito normal
      this.loadCart();
      this.loadAddresses();
      this.loadShippingOptions();
    }

    // Actualizar validación de address_id según delivery_option
    this.orderForm.get('delivery_option')?.valueChanges.subscribe(value => {
      if (value === 'Entrega a Domicilio') {
        this.orderForm.get('address_id')?.setValidators(Validators.required);
      } else {
        this.orderForm.get('address_id')?.clearValidators();
      }
      this.orderForm.get('address_id')?.updateValueAndValidity();
    });
  }

  loadShippingOptions(): void {
    this.isLoading = true;
    this.orderService.getShippingOptions().subscribe({
      next: (response) => {
        console.log('Shipping options response:', response);
        this.shippingOptions = response.data || [];
        // Ensure default delivery_option is valid
        if (this.shippingOptions.length > 0 && !this.shippingOptions.some(option => option.name === this.orderForm.get('delivery_option')?.value)) {
          this.orderForm.patchValue({ delivery_option: this.shippingOptions[0].name });
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.showToast(error.message || 'Error al cargar opciones de envío.', 'error');
        this.isLoading = false;
      }
    });
  }

  loadCart(): void {
    this.isLoading = true;
    this.cartService.loadCart().subscribe({
      next: (response) => {
        this.cart = response;
        this.orderForm.patchValue({
          coupon_code: this.cart.coupon_code || ''
        });
        this.isLoading = false;
        if (this.cart.items.length === 0) {
          this.toastService.showToast('El carrito está vacío. Por favor, añade productos.', 'error');
          this.router.navigate(['/cart']);
        }
      },
      error: (error) => {
        this.toastService.showToast(error.message || 'No se pudo cargar el carrito.', 'error');
        this.isLoading = false;
        this.router.navigate(['/cart']);
      }
    });
  }

  loadAddresses(): void {
    this.isLoading = true;
    this.userService.getProfile().subscribe({
      next: (response: any) => {
        this.address = response.address;
        this.orderForm.patchValue({
          address_id: this.address?.address_id || null
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.showToast(error.message || 'Error al cargar la dirección.', 'error');
        this.isLoading = false;
      }
    });
  }

applyCoupon(): void {
  const couponCode = this.orderForm.get('coupon_code')?.value;
  if (!couponCode) {
    this.toastService.showToast('Por favor, ingresa un código de cupón.', 'error');
    return;
  }

  this.isLoading = true;
  const deliveryOption = this.orderForm.get('delivery_option')?.value;

  // Prepare cart or item for the request
  let requestBody: any = { coupon_code: couponCode, delivery_option: deliveryOption };

  if (this.buyNowItem) {
    // Buy Now mode: Send item
    requestBody.item = {
      product_id: this.buyNowItem.product_id,
      variant_id: this.buyNowItem.variant_id,
      quantity: this.buyNowItem.quantity,
      option_id: this.buyNowItem.customization?.option_id || undefined,
      is_urgent: this.buyNowItem.is_urgent
    };
  } else {
    // Normal cart mode: Send cart
    if (this.cart.items.length === 0) {
      this.isLoading = false;
      this.toastService.showToast('El carrito está vacío. Por favor, añade productos.', 'error');
      return;
    }
    requestBody.cart = {
      items: this.cart.items.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        option_id: item.customization?.option_id || undefined,
        is_urgent: item.is_urgent
      }))
    };
  }

  this.orderService.applyCoupon(couponCode, deliveryOption, requestBody.item, requestBody.cart).subscribe({
    next: (response: ApplyCouponResponse) => {
      this.isLoading = false;
      if (response.success) {
        this.precalculatedTotals = response.data;
        this.couponApplied = true;
        this.cart.coupon_code = couponCode;
        this.cart.total_discount = response.data.total_discount;
        this.cart.total = response.data.total;
        this.cart.total_urgent_delivery_fee = response.data.total_urgent_delivery_fee;
        this.cart.estimated_delivery_days = response.data.estimated_delivery_days;
        this.shippingCost = response.data.shipping_cost;
        this.cart.promotions = response.data.applied_promotions.map(promo => ({
          promotion_id: 0, // Placeholder: Update if backend provides promotion_id
          name: promo.name,
          coupon_type: 'percentage', // Placeholder: Update based on actual coupon type
          discount_value: promo.discount_value.toString(), // Convert to string to match CartPromotion
          is_applicable: true,
          progress_message: 'Cupón aplicado exitosamente', // Placeholder message
          coupon_code: promo.coupon_code || null
        }));
        this.toastService.showToast('Cupón aplicado exitosamente.', 'success');
      } else {
        this.precalculatedTotals = null;
        this.couponApplied = false;
        this.cart.coupon_code = null;
        this.loadCart(); // Reset cart to original state
        this.toastService.showToast(response.message || 'Error al aplicar el cupón.', 'error');
      }
    },
    error: (error) => {
      this.isLoading = false;
      this.precalculatedTotals = null;
      this.couponApplied = false;
      this.cart.coupon_code = null;
      this.loadCart(); // Reset cart to original state
      this.toastService.showToast(error.message || 'Error al aplicar el cupón.', 'error');
    }
  });
}

  createOrder(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      this.toastService.showToast('Por favor, completa todos los campos requeridos.', 'error');
      return;
    }

    this.isLoading = true;
    const orderData: CreateOrderRequest = {
      payment_method: this.orderForm.value.payment_method,
      delivery_option: this.orderForm.value.delivery_option,
      address_id: this.orderForm.value.delivery_option === 'Entrega a Domicilio' ? this.orderForm.value.address_id : undefined,
      coupon_code: this.orderForm.value.coupon_code || undefined,
      item: this.buyNowItem ? {
        product_id: this.buyNowItem.product_id,
        variant_id: this.buyNowItem.variant_id,
        quantity: this.buyNowItem.quantity,
        option_id: this.buyNowItem.customization?.option_id || undefined,
        is_urgent: this.buyNowItem.is_urgent
      } : undefined,
      precalculatedTotals: this.precalculatedTotals || undefined
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (response: CreateOrderResponse) => {
        this.isLoading = false;
        if (response.data.payment_instructions?.payment_url) {
          this.toastService.showToast('Redirigiendo a Mercado Pago...', 'success');
          window.location.href = response.data.payment_instructions.payment_url;
        } else {
          this.toastService.showToast('No se pudo obtener la URL de pago.', 'error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error.message || 'Error al crear la orden';
        console.error('Order creation error:', error);
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  calculateTotals(): { subtotal: number; discount: number; total_urgent_cost: number; shipping_cost: number; total: number } {
    if (this.precalculatedTotals && this.couponApplied) {
      return {
        subtotal: this.cart.total,
        discount: this.precalculatedTotals.total_discount,
        total_urgent_cost: this.precalculatedTotals.total_urgent_delivery_fee,
        shipping_cost: this.precalculatedTotals.shipping_cost,
        total: this.precalculatedTotals.total
      };
    }

    const subtotal = this.cart.total;
    const discount = this.cart.promotions.reduce((totalDiscount: number, promo: CartPromotion) => {
      if (promo.is_applicable) {
        return totalDiscount + (parseFloat(promo.discount_value) * subtotal / 100);
      }
      return totalDiscount;
    }, 0);
    const shipping_cost = this.shippingOptions.find(option => option.name === this.orderForm.get('delivery_option')?.value)?.cost || 0;
    this.shippingCost = shipping_cost;
    const total_urgent_cost = this.cart.total_urgent_delivery_fee || 0;
    const total = Math.max(0, subtotal + shipping_cost + total_urgent_cost - discount);
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

  goToProductDetail(item: CartItem): void {
    this.router.navigate([`/collection/${item.product_id}`], {
      queryParams: { variant_sku: item.variant_sku }
    });
  }
}