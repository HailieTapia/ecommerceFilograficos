import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { AdminOrder } from '../../../services/admin-order.service';
import { ToastService } from '../../../services/toastService';

@Component({
  selector: 'app-order-calendar',
  standalone: true,
  imports: [CommonModule, MatDatepickerModule],
  templateUrl: './order-calendar.component.html',
  styleUrls: ['./order-calendar.component.css'],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderCalendarComponent {
  @Input() currentDate: Date = new Date();
  @Input() selectedDate: Date | null = null;
  @Input() orders: AdminOrder[] = [];
  @Input() dateFilter: 'delivery' | 'creation' = 'delivery';

  @Output() dateSelected = new EventEmitter<Date>();
  @Output() orderSelected = new EventEmitter<AdminOrder>();

  constructor(private datePipe: DatePipe, private toastService: ToastService) {}

  getOrdersForDate(date: Date): AdminOrder[] {
    return this.orders.filter((order) => {
      const orderDate =
        this.dateFilter === 'delivery' ? new Date(order.estimated_delivery_date) : new Date(order.created_at);
      return this.datePipe.transform(orderDate, 'yyyy-MM-dd') === this.datePipe.transform(date, 'yyyy-MM-dd');
    });
  }

  onDateSelected(date: Date | null): void {
    if (date) {
      this.dateSelected.emit(date);
      this.toastService.showToast(`Fecha seleccionada: ${this.datePipe.transform(date, 'dd/MM/yyyy')}`, 'info');
    } else {
      this.toastService.showToast('No se seleccionó ninguna fecha', 'warning');
    }
  }

  onOrderSelected(order: AdminOrder, event: Event): void {
    event.stopPropagation();
    this.orderSelected.emit(order);
  }

  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-800 dark:text-yellow-100 dark:border-yellow-700',
      processing: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-700',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-800 dark:text-purple-100 dark:border-purple-700',
      delivered: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-800 dark:text-green-100 dark:border-green-700',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700';
  }

  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      pending: 'fa-clock',
      processing: 'fa-box',
      shipped: 'fa-truck',
      delivered: 'fa-check-circle',
    };
    return statusIcons[status] || 'fa-warning';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  getDateClass = (date: Date): string => {
    const orders = this.getOrdersForDate(date);
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();
    const isInMonth =
      date.getMonth() === this.currentDate.getMonth() && date.getFullYear() === this.currentDate.getFullYear();

    return `
      ${isToday ? 'ring-2 ring-blue-500' : ''}
      ${isSelected ? 'bg-blue-50' : ''}
      ${!isInMonth ? 'text-gray-400 bg-gray-50' : 'bg-white'}
      ${orders.length > 0 ? 'has-orders' : ''}
      min-h-[100px] p-2 hover:bg-gray-50 cursor-pointer transition-all
    `;
  };

  getSpanClasses(date: Date): string[] {
    const classes: string[] = [];
    if (date.toDateString() === new Date().toDateString()) {
      classes.push('text-blue-600', 'dark:text-blue-400');
    }
    if (
      date.getMonth() !== this.currentDate.getMonth() ||
      date.getFullYear() !== this.currentDate.getFullYear()
    ) {
      classes.push('text-gray-400', 'dark:text-gray-500');
    }
    if (this.selectedDate && date.toDateString() === this.selectedDate.toDateString()) {
      classes.push('bg-blue-50', 'dark:bg-blue-900');
    }
    return classes;
  }

  previousMonth(): void {
    const newDate = new Date(this.currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    this.currentDate = newDate;
    this.dateSelected.emit(this.currentDate);
  }

  nextMonth(): void {
    const newDate = new Date(this.currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    this.currentDate = newDate;
    this.dateSelected.emit(this.currentDate);
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.dateSelected.emit(this.currentDate);
  }
}