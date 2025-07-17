import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService, OrderResponse, OrderDetail, Address, OrderHistory } from '../../services/order.service';
import { ToastService } from '../../services/toastService';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.css']
})
export class OrderConfirmationComponent implements OnInit {
  order: OrderResponse['data'] | null = null;
  isLoading: boolean = false;

  constructor(
    private orderService: OrderService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId && !isNaN(+orderId)) {
      this.loadOrderDetails(+orderId);
    } else {
      this.toastService.showToast('ID de orden no válido.', 'error');
      this.router.navigate(['/orders']);
    }
  }

  loadOrderDetails(orderId: number): void {
    this.isLoading = true;
    this.orderService.getOrderById(orderId).subscribe({
      next: (response: OrderResponse) => {
        this.isLoading = false;
        if (response.success) {
          this.order = response.data;
          this.toastService.showToast('Detalles de la orden cargados exitosamente.', 'success');
        } else {
          this.toastService.showToast(response.message, 'error');
          this.router.navigate(['/orders']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error?.message || 'Error al cargar los detalles de la orden.';
        this.toastService.showToast(errorMessage, 'error');
        this.router.navigate(['/orders']);
      }
    });
  }

  getFormattedAddress(address: Address | null, deliveryOption: string | null): string {
    if (!address && deliveryOption !== 'Entrega a Domicilio') return deliveryOption || 'Sin dirección especificada';
    if (!address) return 'Sin dirección especificada';
    return `${address.street}, ${address.city}, ${address.state} ${address.postal_code}`;
  }

  getFormattedDate(date: string): string {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  trackByOrderDetailId(index: number, item: OrderDetail): number {
    return item.detail_id;
  }

  trackByHistoryId(index: number, history: OrderHistory): number {
    return history.history_id;
  }
}