import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService, OrdersResponse } from '../../services/order.service';
import { ToastService } from '../../services/toastService';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, SpinnerComponent],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  orders: OrdersResponse['data']['orders'] = [];
  pagination: OrdersResponse['data']['pagination'] = {
    totalOrders: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 0
  };
  isLoading: boolean = false;

  constructor(
    private orderService: OrderService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadOrders(1);
  }

  loadOrders(page: number): void {
    this.isLoading = true;
    this.orderService.getOrders(page, this.pagination.pageSize).subscribe({
      next: (response: OrdersResponse) => {
        this.isLoading = false;
        if (response.success) {
          this.orders = response.data.orders.map(order => ({
            ...order,
            total: typeof order.total === 'string' ? parseFloat(order.total) : order.total
          }));
          this.pagination = response.data.pagination;
          if (this.orders.length === 0 && page === 1) {
            this.toastService.showToast('No tienes órdenes registradas.', 'info');
          }
        } else {
          this.toastService.showToast(response.message, 'error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error?.message || 'Error al cargar las órdenes.';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.loadOrders(page);
    }
  }

  getFormattedDate(date: string): string {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTotal(total: number | string | undefined): string {
    if (total == null) return '0.00';
    const num = typeof total === 'string' ? parseFloat(total) : total;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  }

  getImageUrl(order: OrdersResponse['data']['orders'][0]): string {
    return order.first_item_name ? `https://via.placeholder.com/100?text=${encodeURIComponent(order.first_item_name)}` : 'https://via.placeholder.com/100?text=No+Image';
  }

  getOrderStatusInSpanish(status: string): string {
    const statusMap: { [key: string]: string } = {
      'delivered': 'Entregado',
      'processing': 'Procesando',
      'shipped': 'Enviado',
      'pending': 'Pendiente'
    };
    return statusMap[status.toLowerCase()] || status;
  }

  trackByOrderId(index: number, order: OrdersResponse['data']['orders'][0]): number {
    return order.order_id;
  }
}