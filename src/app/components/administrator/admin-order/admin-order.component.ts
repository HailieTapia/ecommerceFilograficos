import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AdminOrderService, AdminOrder, AdminOrdersResponse, AdminOrderResponse, AdminOrderSummaryResponse, UpdateOrderStatusRequest, AdminOrdersByDateResponse, UpdateOrderStatusResponse } from '../../services/admin-order.service';
import { ToastService } from '../../services/toastService';
import { ModalComponent } from '../../../modal/modal.component';
import moment from 'moment';

// Definir tipos de estado para usar como claves
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';

@Component({
  selector: 'app-admin-order',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule, ModalComponent],
  templateUrl: './admin-order.component.html',
  providers: [DatePipe]
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
  statusFilter: 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' = 'all';
  dateField: 'delivery' | 'creation' = 'delivery';
  paymentMethod = '';
  deliveryOption = '';
  minTotal: number | null = null;
  maxTotal: number | null = null;
  isUrgent: boolean | null = null;

  // Exponer moment como propiedad para uso en el componente
  protected moment = moment;

  // Configuración del calendario
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    events: [],
    dateClick: this.handleDateClick.bind(this),
    eventClick: this.handleEventClick.bind(this),
    height: 'auto',
    locale: 'es',
    firstDay: 1,
    headerToolbar: {
      left: 'prev,today,next',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
    },
    dayHeaderClassNames: 'bg-light-table-header dark:bg-dark-table-header text-light-text dark:text-dark-text font-medium',
    dayCellClassNames: 'hover:bg-light-row-hover dark:hover:bg-dark-row-hover transition-colors',
    eventClassNames: (info) => {
      const order = info.event.extendedProps['order'] as AdminOrder;
      return [`fc-event-${order.order_status.toLowerCase()}`, 'cursor-pointer', 'text-xs', 'font-medium'];
    },
    eventContent: this.customEventContent.bind(this),
    eventDisplay: 'block',
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: true },
    themeSystem: 'standard',
  };

  // Método para personalizar el contenido de los eventos
  private customEventContent(arg: any): { html: string } {
    const order = arg.event.extendedProps['order'] as AdminOrder;
    const statusColor = this.getEventColor(order.order_status);
    return {
      html: `
        <div class="p-1 rounded border-l-4" style="border-color: ${statusColor}">
          <div class="font-semibold truncate">#${order.order_id}</div>
          <div class="text-xs truncate">${order.customer_name}</div>
        </div>
      `,
    };
  }

  // Formateador de moneda
  private currencyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });

  constructor(
    private orderService: AdminOrderService,
    private toastService: ToastService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadSummary();
  }

  ngAfterViewInit(): void {
    this.updateCalendarEvents();
  }

  // Cargar órdenes con filtros
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
        this.updateCalendarEvents(response.data.ordersByDay);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.isLoading = false;
        this.toastService.showToast(err.message || 'Error al cargar las órdenes', 'error');
      },
    });
  }

  // Cargar estadísticas
  loadSummary(): void {
    this.orderService.getOrderSummary().subscribe({
      next: (response: AdminOrderSummaryResponse) => {
        this.summary = response.data;
      },
      error: (err) => {
        this.error = err.message;
        this.toastService.showToast(err.message || 'Error al cargar el resumen', 'error');
      },
    });
  }

  // Cargar órdenes para una fecha específica
  handleDateClick(arg: any): void {
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
      },
    });
  }

  // Mostrar detalles de una orden desde el calendario
  handleEventClick(arg: EventClickArg): void {
    const orderId = parseInt(arg.event.id, 10);
    this.loadOrderDetails(orderId);
  }

  // Mostrar detalles de una orden desde la lista
  handleOrderClick(orderId: number): void {
    this.loadOrderDetails(orderId);
  }

  // Método auxiliar para cargar detalles de una orden
  private loadOrderDetails(orderId: number): void {
    this.orderService.getOrderById(orderId).subscribe({
      next: (response: AdminOrderResponse) => {
        this.selectedOrder = response.data;
        this.orderModal.open();
      },
      error: (err) => {
        this.error = err.message;
        this.toastService.showToast(err.message || 'Error al cargar detalles de la orden', 'error');
      },
    });
  }

  // Actualizar estado de una orden
  updateOrderStatus(orderId: number, newStatus: 'pending' | 'processing' | 'shipped' | 'delivered'): void {
    const request: UpdateOrderStatusRequest = { newStatus };
    this.orderService.updateOrderStatus(orderId, request).subscribe({
      next: (response: UpdateOrderStatusResponse) => {
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
      },
    });
  }

  // Actualizar eventos del calendario
  private updateCalendarEvents(ordersByDay: { [date: string]: AdminOrder[] } = {}): void {
    const events: EventInput[] = [];
    const currentOrdersByDay = ordersByDay || this.groupOrdersByDate(this.orders);
    Object.keys(currentOrdersByDay).forEach(date => {
      currentOrdersByDay[date].forEach(order => {
        events.push({
          id: order.order_id.toString(),
          title: `#${order.order_id} - ${order.customer_name} (${order.order_status})`,
          start: date,
          backgroundColor: this.getEventColor(order.order_status),
          borderColor: this.getEventBorderColor(order.order_status),
          textColor: this.getEventTextColor(order.order_status),
          extendedProps: { order },
        });
      });
    });
    this.calendarOptions.events = events;
  }

  // Agrupar órdenes por fecha
  private groupOrdersByDate(orders: AdminOrder[]): { [date: string]: AdminOrder[] } {
    const grouped: { [date: string]: AdminOrder[] } = {};
    orders.forEach(order => {
      const date = moment(this.dateField === 'delivery' ? order.estimated_delivery_date : order.created_at).format('YYYY-MM-DD');
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(order);
    });
    return grouped;
  }

  // Obtener colores según el estado con índice de firma
  private getEventColor(status: OrderStatus): string {
    const colors: { [key in OrderStatus]: string } = {
      pending: '#FACC15',
      processing: '#DBEAFE',
      shipped: '#E0E7FF',
      delivered: '#DCFCE7',
    };
    return colors[status] || '#E5E7EB';
  }

  private getEventBorderColor(status: OrderStatus): string {
    const colors: { [key in OrderStatus]: string } = {
      pending: '#92400E',
      processing: '#1E3A8A',
      shipped: '#4B5563',
      delivered: '#065F46',
    };
    return colors[status] || '#6B7280';
  }

  private getEventTextColor(status: OrderStatus): string {
    const colors: { [key in OrderStatus]: string } = {
      pending: '#92400E',
      processing: '#1E3A8A',
      shipped: '#4B5563',
      delivered: '#065F46',
    };
    return colors[status] || '#E5E7EB';
  }

  // Aplicar filtros
  applyFilters(): void {
    this.loadOrders();
  }

  // Formatear fecha
  formatDate(date: string | Date): string {
    const dateStr = typeof date === 'string' ? date : moment(date).format('YYYY-MM-DD');
    return this.datePipe.transform(dateStr, 'dd MMM yyyy', 'es-MX') || dateStr;
  }

  // Formatear moneda
  formatCurrency(amount: number): string {
    return this.currencyFormatter.format(amount);
  }
}