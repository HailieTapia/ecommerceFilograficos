import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { ToastService } from '../../services/toastService';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  template: `
    <app-spinner [isLoading]="isLoading"></app-spinner>
    <div *ngIf="!isLoading" class="max-w-5xl mx-auto py-10 px-5 bg-light-background dark:bg-dark-background min-h-screen font-sans">
      <div *ngIf="paymentStatus === 'success'" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
        <h1 class="text-2xl font-bold text-light-text dark:text-dark-text">¡Pago exitoso!</h1>
        <p class="text-light-secondary dark:text-dark-secondary mt-4">Tu orden está siendo procesada. Serás redirigido a la confirmación.</p>
      </div>
      <div *ngIf="paymentStatus === 'pending'" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
        <h1 class="text-2xl font-bold text-light-text dark:text-dark-text">Pago pendiente</h1>
        <p class="text-light-secondary dark:text-dark-secondary mt-4">Tu pago está en proceso. Por favor, verifica más tarde.</p>
        <button (click)="goToOrders()" class="mt-4 bg-light-primary dark:bg-dark-primary text-white py-2 px-4 rounded-full hover:bg-light-primary-hover dark:hover:bg-dark-primary-hover transition-colors">
          Ver Mis Órdenes
        </button>
      </div>
      <div *ngIf="paymentStatus === 'failure'" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
        <h1 class="text-2xl font-bold text-light-text dark:text-dark-text">Pago fallido</h1>
        <p class="text-light-secondary dark:text-dark-secondary mt-4">Hubo un problema con tu pago. Intenta de nuevo.</p>
        <button (click)="goToCheckout()" class="mt-4 bg-light-primary dark:bg-dark-primary text-white py-2 px-4 rounded-full hover:bg-light-primary-hover dark:hover:bg-dark-primary-hover transition-colors">
          Volver a Pagar
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./payment-callback.component.css']
})
export class PaymentCallbackComponent implements OnInit {
  isLoading: boolean = true;
  paymentStatus: 'success' | 'pending' | 'failure' | null = null;
  orderId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const status = this.route.snapshot.queryParams['status'];
    this.orderId = this.route.snapshot.queryParams['external_reference'] ? +this.route.snapshot.queryParams['external_reference'] : null;

    if (!status || !this.orderId) {
      this.toastService.showToast('Datos de pago no válidos.', 'error');
      this.router.navigate(['/orders']);
      return;
    }

    this.isLoading = true;
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (response) => {
        this.isLoading = false;
        const orderPaymentStatus = response.data.payment_status; // Usar payment_status de la tabla orders
        const paymentStatus = response.data.payment?.status; // Estado del pago desde la tabla payments (opcional)

        // Priorizar payment_status de orders, con fallback a payment.status
        this.paymentStatus = orderPaymentStatus === 'approved' ? 'success' : 
                           orderPaymentStatus === 'pending' || orderPaymentStatus === 'in_process' ? 'pending' : 
                           orderPaymentStatus === 'rejected' || orderPaymentStatus === 'failed' ? 'failure' : null;

        // Si paymentStatus no está definido, usar el status del query param como fallback
        if (!this.paymentStatus && status === 'approved') {
          this.paymentStatus = 'success';
        } else if (!this.paymentStatus) {
          this.paymentStatus = 'pending'; // Default si no hay coincidencia
        }

        if (this.paymentStatus === 'success') {
          this.router.navigate(['/order-confirmation', this.orderId]);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.paymentStatus = 'failure';
        this.toastService.showToast(error?.error?.message || 'Error al verificar el pago.', 'error');
      }
    });
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  goToCheckout(): void {
    this.router.navigate(['/checkout']);
  }
}