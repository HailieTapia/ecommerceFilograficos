import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService, OrderResponse } from '../../../services/order.service';
import { PromotionService, Promotion } from '../../../services/promotion.service';
import { ToastService } from '../../../services/toastService';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';
import { CommonModule } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  templateUrl: './payment-callback.component.html',
  styleUrls: ['./payment-callback.component.css']
})
export class PaymentCallbackComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isLoading: boolean = true;
  paymentStatus: 'success' | 'pending' | 'failure' | null = null;
  orderId: number | null = null;
  orderDetails: OrderResponse['data'] | null = null;
  appliedPromotion: Promotion | null = null;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private promotionService: PromotionService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const status = this.route.snapshot.queryParams['status'];
    this.orderId = this.route.snapshot.queryParams['external_reference'] ? +this.route.snapshot.queryParams['external_reference'] : null;

    if (!status || !this.orderId || isNaN(this.orderId)) {
      this.toastService.showToast('Datos de pago no válidos.', 'error');
      this.router.navigate(['/orders']);
      return;
    }

    this.isLoading = true;
    this.orderService.getOrderById(this.orderId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: OrderResponse) => {
        this.orderDetails = response.data;
        const paymentStatus = response.data.payment?.status;

        // Map payment status to component state
        this.paymentStatus = paymentStatus === 'approved' ? 'success' :
          ['pending', 'in_process'].includes(paymentStatus) ? 'pending' :
            ['rejected', 'failed'].includes(paymentStatus) ? 'failure' : 'pending';

        // If a coupon was applied, fetch promotion details
        if (response.data.order.coupon_code) {
          this.promotionService.getAvailablePromotions().pipe(takeUntil(this.destroy$)).subscribe({
            next: (promotionResponse) => {
              this.appliedPromotion = promotionResponse.promotions.find(p => p.coupon_code === response.data.order.coupon_code) || null;
              this.completePaymentProcessing();
            },
            error: (error) => {
              console.error('Error fetching promotion details:', error);
              this.completePaymentProcessing();
            }
          });
        } else {
          this.completePaymentProcessing();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.paymentStatus = 'failure';
        this.toastService.showToast(error?.error?.message || 'Error al verificar el pago.', 'error');
      }
    });
  }

  private completePaymentProcessing(): void {
    this.isLoading = false;
    if (this.paymentStatus === 'success') {
      this.toastService.showToast('¡Pago procesado exitosamente!', 'success');
      setTimeout(() => {
        this.router.navigate(['/order-confirmation', this.orderId]);
      }, 3000);
    } else if (this.paymentStatus === 'pending') {
      this.toastService.showToast('Tu pago está en proceso. Verifica el estado en tus órdenes.', 'info');
    } else if (this.paymentStatus === 'failure') {
      this.toastService.showToast('Hubo un problema con tu pago. Intenta de nuevo.', 'error');
    }
  }

  // Helper method to safely access order total
  getOrderTotal(): string {
    return this.orderDetails?.order?.total ? this.orderDetails.order.total.toFixed(2) : 'N/A';
  }

  // Helper method to safely access order discount
  getOrderDiscount(): string {
    return this.orderDetails?.order?.total_discount ? this.orderDetails.order.total_discount.toFixed(2) : '0.00';
  }

  // Helper method to check if discount is applied
  hasDiscount(): boolean {
    return this.orderDetails?.order?.total_discount ? this.orderDetails.order.total_discount > 0 : false;
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  goToCheckout(): void {
    this.router.navigate(['/checkout'], { state: { orderId: this.orderId } });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}