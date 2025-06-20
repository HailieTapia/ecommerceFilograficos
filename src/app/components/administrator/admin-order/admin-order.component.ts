import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AdminOrder, AdminOrderService, AdminOrderSummary, AdminOrdersResponse } from '../../services/admin-order.service';
import { OrderCalendarComponent } from './order-calendar/order-calendar.component';
import { OrderFilterComponent } from './order-filter/order-filter.component';
import { OrderSummaryComponent } from './order-summary/order-summary.component';
import { OrderListComponent } from './order-list/order-list.component';
import { OrderModalComponent } from './order-modal/order-modal.component';
import { ToastService } from '../../services/toastService';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-admin-order',
  standalone: true,
  imports: [
    CommonModule,
    OrderCalendarComponent,
    OrderFilterComponent,
    OrderSummaryComponent,
    OrderListComponent,
    OrderModalComponent,
  ],
  templateUrl: './admin-order.component.html',
  styleUrls: ['./admin-order.component.css'],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrderComponent implements OnInit {
  orders: AdminOrder[] = [];
  summary: AdminOrderSummary | null = null;
  currentDate: Date = new Date();
  selectedDate: Date | null = null;
  selectedOrder: AdminOrder | null = null;
  searchTerm: string = '';
  statusFilter: string = 'all';
  dateFilter: 'delivery' | 'creation' = 'delivery';

  constructor(
    private orderService: AdminOrderService,
    private toastService: ToastService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.setupFilterDebounce();
  }

  loadOrders(): void {
    this.orderService
      .getOrders(
        1,
        10,
        this.searchTerm,
        this.statusFilter as 'all' | 'pending' | 'processing' | 'shipped' | 'delivered',
        this.selectedDate ? this.datePipeTransform(this.selectedDate) : '',
        this.dateFilter
      )
      .subscribe({
        next: (response: AdminOrdersResponse) => {
          this.orders = response.data.orders; // No convertimos fechas, ya que son strings
          this.summary = response.data.summary || {
            totalOrders: response.data.pagination.totalOrders,
            pendingCount: response.data.orders.filter((o: AdminOrder) => o.order_status === 'pending').length,
            processingCount: response.data.orders.filter((o: AdminOrder) => o.order_status === 'processing').length,
            shippedCount: response.data.orders.filter((o: AdminOrder) => o.order_status === 'shipped').length,
            deliveredCount: response.data.orders.filter((o: AdminOrder) => o.order_status === 'delivered').length,
          };
        },
        error: (err) => {
          this.toastService.showToast('Error al cargar las órdenes', 'error');
        },
      });
  }

  private datePipeTransform(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd')!;
  }

  setupFilterDebounce(): void {
    of(this.searchTerm)
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(() => {
          this.loadOrders();
          return of(null);
        })
      )
      .subscribe();
  }

  onSearchTermChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.loadOrders();
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter = status;
    this.loadOrders();
  }

  onDateFilterChange(dateFilter: string): void {
    if (dateFilter === 'delivery' || dateFilter === 'creation') {
      this.dateFilter = dateFilter;
      this.loadOrders();
    } else {
      this.toastService.showToast('Filtro de fecha inválido', 'error');
    }
  }

  onDateSelected(date: Date): void {
    this.selectedDate = date;
    this.loadOrders();
  }

  onOrderSelected(order: AdminOrder): void {
    this.orderService.getOrderById(order.order_id).subscribe({
      next: (response) => {
        this.selectedOrder = response.data; // No convertimos fechas, ya que son strings
      },
      error: () => {
        this.toastService.showToast('Error al cargar los detalles de la orden', 'error');
      },
    });
  }

  onUpdateStatus(request: { newStatus: 'pending' | 'processing' | 'shipped' | 'delivered' }): void {
    if (this.selectedOrder) {
      this.orderService.updateOrderStatus(this.selectedOrder.order_id, request).subscribe({
        next: () => {
          this.loadOrders();
          this.selectedOrder = null;
          this.toastService.showToast('Estado de la orden actualizado', 'success');
        },
        error: () => {
          this.toastService.showToast('Error al actualizar el estado de la orden', 'error');
        },
      });
    }
  }

  onCloseModal(): void {
    this.selectedOrder = null;
  }
}