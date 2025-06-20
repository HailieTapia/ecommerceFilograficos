import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminOrder } from '../../../services/admin-order.service';
import { ToastService } from '../../../services/toastService';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-list.component.html'
})
export class OrderListComponent {
  @Input() orders: AdminOrder[] = [];
  @Input() selectedDate: Date | null = null;
  @Input() dateFilter: 'delivery' | 'creation' = 'delivery';

  @Output() orderSelected = new EventEmitter<AdminOrder>();

  constructor(private toastService: ToastService) {}

  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-800 dark:text-yellow-100 dark:border-yellow-700',
      processing: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-700',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-800 dark:text-purple-100 dark:border-purple-700',
      delivered: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-800 dark:text-green-100 dark:border-green-700'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  trackByOrderId(index: number, order: AdminOrder): number {
    return order.order_id;
  }

  onOrderSelect(order: AdminOrder): void {
    this.orderSelected.emit(order);
    this.toastService.showToast(`Orden #${order.order_id} seleccionada`, 'info');
  }
}