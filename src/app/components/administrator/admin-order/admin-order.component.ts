import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, EventClickArg } from '@fullcalendar/core';
import { DateClickArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AdminOrderService, AdminOrder, AdminOrdersResponse, AdminOrderResponse, AdminOrderSummaryResponse, UpdateOrderStatusRequest, AdminOrdersByDateResponse } from '../../services/admin-order.service';
import { ToastService } from '../../services/toastService';
import { ModalComponent } from '../../../modal/modal.component';
import moment from 'moment';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';

@Component({
  selector: 'app-admin-order',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule, ModalComponent],
  templateUrl: './admin-order.component.html',
  styleUrls: ['./admin-order.component.css'],
  providers: [DatePipe, CurrencyPipe]
})
export class AdminOrderComponent implements OnInit, AfterViewInit {
  @ViewChild('orderModal') orderModal!: ModalComponent;

  orders: AdminOrder[] = [];
  summary: AdminOrderSummaryResponse['data'] | null = null;
  selectedOrder: AdminOrder | null = null;
  selectedDate: Date | null = null;
  isLoading = false;
  error: string | null = null;

  // Filtros
  searchTerm = '';
  statusFilter: 'all' | OrderStatus = 'all';
  dateField: 'delivery' | 'creation' = 'delivery';
  paymentMethod = '';
  deliveryOption = '';
  minTotal: number | null = null;
  maxTotal: number | null = null;
  isUrgent: boolean | null = null;

  protected moment = moment;

  private statusTranslations: { [key in OrderStatus]: string } = {
    pending: 'Pendiente',
    processing: 'Procesando',
    shipped: 'Enviado',
    delivered: 'Entregado'
  };

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    events: [],
    dateClick: this.handleDateClick.bind(this),
    eventClick: this.handleEventClick.bind(this),
    height: 'auto',
    locale: 'es',
    firstDay: 0,
    headerToolbar: {
      left: 'prev,today,next',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día'
    },
    dayHeaderClassNames: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium',
    dayCellClassNames: 'hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors',
    eventClassNames: (info) => {
      const order = info.event.extendedProps['order'] as AdminOrder;
      return [`fc-event-${order.order_status.toLowerCase()}`, 'cursor-pointer', 'text-xs', 'font-medium', this.getStatusClasses(order.order_status)];
    },
    eventContent: this.customEventContent.bind(this),
    dayCellContent: this.customDayCellContent.bind(this),
    eventDisplay: 'block',
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: true },
    themeSystem: 'standard'
  };

  constructor(
    private orderService: AdminOrderService,
    private toastService: ToastService,
    private datePipe: DatePipe,
    private currencyPipe: CurrencyPipe
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadSummary();
  }

  ngAfterViewInit(): void {
    this.updateCalendarEvents();
  }

  customEventContent(arg: any): { html: string } {
    const order = arg.event.extendedProps['order'] as AdminOrder;
    const statusColor = this.getEventColor(order.order_status);
    const maxLength = 20; // Limit text length to prevent overflow
    const truncatedTitle = `#${order.order_id} - ${order.customer_name.length > maxLength ? order.customer_name.substring(0, maxLength) + '...' : order.customer_name}`;
    return {
      html: `
        <div class="p-1 rounded text-xs truncate" style="max-width: 100%; border-left: 4px solid ${statusColor}; background-color: ${this.getEventColor(order.order_status)}">
          <div class="font-semibold truncate">${truncatedTitle}</div>
        </div>
      `
    };
  }

  customDayCellContent(arg: any): { html: string } {
    const dateStr = moment(arg.date).format('YYYY-MM-DD');
    const dayOrders = this.orders.filter(order => {
      const orderDate = this.dateField === 'delivery' ? order.estimated_delivery_date : order.created_at;
      return moment(orderDate).format('YYYY-MM-DD') === dateStr;
    });
    const isToday = moment(arg.date).isSame(moment(), 'day');
    const countText = `${dayOrders.length} orden${dayOrders.length !== 1 ? 'es' : ''}`;
    const countClass = dayOrders.length > 5 ? 'bg-red-100 text-red-800' :
                      dayOrders.length > 2 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800';

    return {
      html: `
        <div class="flex flex-col h-full">
          <div class="text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'} mb-1">
            ${arg.dayNumberText}
          </div>
          ${dayOrders.length > 0 ? `
            <div class="mt-auto text-right">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${countClass}">
                ${countText}
              </span>
            </div>` : ''}
        </div>
      `
    };
  }

  loadOrders(): void {
    this.isLoading = true;
    const startDate = moment().startOf('month').format('YYYY-MM-DD');
    const endDate = moment().endOf('month').format('YYYY-MM-DD');
    this.orderService.getOrders(
      1,
      50,
      this.searchTerm,
      this.statusFilter,
      `${startDate},${endDate}`,
      this.dateField,
      this.paymentMethod,
      this.deliveryOption,
      this.minTotal,
      this.maxTotal,
      this.isUrgent
    ).subscribe({
      next: (response: AdminOrdersResponse) => {
        this.orders = response.data.orders;
        this.updateCalendarEvents();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.isLoading = false;
        this.toastService.showToast(err.message || 'Error al cargar las órdenes', 'error');
      }
    });
  }

  loadSummary(): void {
    this.orderService.getOrderSummary().subscribe({
      next: (response: AdminOrderSummaryResponse) => {
        this.summary = response.data;
      },
      error: (err) => {
        this.error = err.message;
        this.toastService.showToast(err.message || 'Error al cargar el resumen', 'error');
      }
    });
  }

  handleDateClick(arg: DateClickArg): void {
    this.selectedDate = arg.date;
    const date = moment(arg.date).format('YYYY-MM-DD');
    this.orderService.getOrdersByDate(date, this.dateField).subscribe({
      next: (response: AdminOrdersByDateResponse) => {
        this.orders = response.data;
        this.updateCalendarEvents();
        this.toastService.showToast(`Órdenes cargadas para ${this.formatDate(date)}`, 'info');
      },
      error: (err) => {
        this.error = err.message;
        this.toastService.showToast(err.message || 'Error al cargar órdenes por fecha', 'error');
      }
    });
  }

  handleEventClick(arg: EventClickArg): void {
    const orderId = parseInt(arg.event.id, 10);
    this.loadOrderDetails(orderId);
  }

  handleOrderClick(orderId: number): void {
    this.loadOrderDetails(orderId);
  }

  private loadOrderDetails(orderId: number): void {
    this.orderService.getOrderById(orderId).subscribe({
      next: (response: AdminOrderResponse) => {
        this.selectedOrder = response.data;
        this.orderModal.open();
      },
      error: (err) => {
        this.error = err.message;
        this.toastService.showToast(err.message || 'Error al cargar detalles de la orden', 'error');
      }
    });
  }

  updateOrderStatus(orderId: number, newStatus: OrderStatus): void {
    const request: UpdateOrderStatusRequest = { newStatus };
    this.orderService.updateOrderStatus(orderId, request).subscribe({
      next: (response: any) => { // Adjust type if needed based on your response
        this.orders = this.orders.map(order =>
          order.order_id === orderId ? response.data : order
        );
        if (this.selectedOrder?.order_id === orderId) {
          this.selectedOrder = response.data;
        }
        this.updateCalendarEvents();
        this.toastService.showToast('Estado de la orden actualizado exitosamente', 'success');
      },
      error: (err) => {
        this.error = err.message;
        this.toastService.showToast(err.message || 'Error al actualizar el estado', 'error');
      }
    });
  }

  private updateCalendarEvents(): void {
    const events: EventInput[] = this.orders.map(order => ({
      id: order.order_id.toString(),
      title: `#${order.order_id} - ${order.customer_name}`,
      start: this.dateField === 'delivery' ? order.estimated_delivery_date : order.created_at,
      end: this.dateField === 'delivery' ? moment(order.estimated_delivery_date).add(1, 'day').format('YYYY-MM-DD') : moment(order.created_at).add(1, 'day').format('YYYY-MM-DD'), // Ensure event spans the day
      backgroundColor: this.getEventColor(order.order_status),
      borderColor: this.getEventBorderColor(order.order_status),
      textColor: this.getEventTextColor(order.order_status),
      extendedProps: { order }
    }));
    this.calendarOptions.events = events;
  }

  private getEventColor(status: OrderStatus): string {
    const colors: { [key in OrderStatus]: string } = {
      pending: '#FEF3C7',
      processing: '#DBEAFE',
      shipped: '#E0E7FF',
      delivered: '#DCFCE7'
    };
    return colors[status] || '#E5E7EB';
  }

  private getEventBorderColor(status: OrderStatus): string {
    const colors: { [key in OrderStatus]: string } = {
      pending: '#D97706',
      processing: '#2563EB',
      shipped: '#6B7280',
      delivered: '#16A34A'
    };
    return colors[status] || '#6B7280';
  }

  private getEventTextColor(status: OrderStatus): string {
    const colors: { [key in OrderStatus]: string } = {
      pending: '#92400E',
      processing: '#1E3A8A',
      shipped: '#4B5563',
      delivered: '#065F46'
    };
    return colors[status] || '#374151';
  }

  getStatusTranslation(status: OrderStatus): string {
    return this.statusTranslations[status] || status;
  }

  getStatusClasses(status: OrderStatus): string {
    const classes: { [key in OrderStatus]: string } = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200'
    };
    return classes[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getPaymentStatusClasses(status: string): string {
    const classes: { [key: string]: string } = {
      pending: 'bg-red-100 text-red-800',
      validated: 'bg-green-100 text-green-800',
      failed: 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  applyFilters(): void {
    this.loadOrders();
  }

  formatDate(date: string | Date): string {
    const dateStr = typeof date === 'string' ? date : moment(date).format('YYYY-MM-DD');
    return this.datePipe.transform(dateStr, 'dd MMM yyyy', 'es-MX') || dateStr;
  }

  formatCurrency(amount: number): string {
    return this.currencyPipe.transform(amount, 'MXN', 'symbol', '1.2-2', 'es-MX') || '0';
  }
}