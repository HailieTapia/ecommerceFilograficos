import { Component, OnInit, LOCALE_ID } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, OrdersResponse } from '../../services/order.service';
import { ToastService } from '../../services/toastService';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { RecommendedProductsComponent } from '../recommended-products/recommended-products.component';

// Registrar los datos de localización para español
registerLocaleData(localeEs);

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SpinnerComponent, DatePipe,RecommendedProductsComponent],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
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
  searchTerm: string = '';
  dateFilter: string = '';
  pendingCount: number = 0;
  shippedCount: number = 0;
  deliveredCount: number = 0;

  filterOptions: { value: string; label: string }[] = [];

  constructor(
    private orderService: OrderService,
    private toastService: ToastService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.generateFilterOptions();
    this.loadOrders(1);
  }

  generateFilterOptions(): void {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    this.filterOptions = [
      { value: '', label: 'Todas' },
      { value: this.getMonthRange(currentMonth, currentYear), label: 'Este mes' },
      { value: this.getMonthRange(lastMonth, lastYear), label: 'Mes pasado' },
      { value: currentYear.toString(), label: 'Este año' }
    ];

    for (let year = 2024; year < currentYear; year++) {
      this.filterOptions.push({ value: year.toString(), label: year.toString() });
    }
  }

  getMonthRange(month: number, year: number): string {
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
    return `${start},${end}`;
  }

  loadOrders(page: number): void {
    this.isLoading = true;
    this.orderService.getOrders(page, this.pagination.pageSize, this.searchTerm, this.dateFilter).subscribe({
      next: (response: OrdersResponse) => {
        this.isLoading = false;
        if (response.success) {
          this.orders = response.data.orders;
          this.pagination = response.data.pagination;
          this.updateOrderCounts();
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

  updateOrderCounts(): void {
    this.pendingCount = this.orders.filter(o => o.order_status === 'pending').length;
    this.shippedCount = this.orders.filter(o => o.order_status === 'shipped').length;
    this.deliveredCount = this.orders.filter(o => o.order_status === 'delivered').length;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.loadOrders(page);
    }
  }

  getFormattedDate(date: string): string {
    return this.datePipe.transform(date, "d 'de' MMMM 'de' yyyy HH:mm", undefined, 'es') || 'Fecha no disponible';
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

  performSearch(): void {
    if (!this.searchTerm.trim()) {
      this.searchTerm = '';
    }
    this.loadOrders(1);
  }

  onFilterChange(): void {
    this.loadOrders(1);
  }
}