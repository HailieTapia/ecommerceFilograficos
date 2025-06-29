import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AdminOrderService, AdminOrder, AdminOrdersResponse, AdminOrderResponse, AdminOrderSummaryResponse, UpdateOrderStatusRequest, AdminOrdersByDateResponse, UpdateOrderStatusResponse } from '../../services/admin-order.service';
import { ToastService } from '../../services/toastService';
import { ModalComponent } from '../../../modal/modal.component';
import moment from 'moment';

@Component({
  selector: 'app-admin-order',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule,
    ModalComponent
  ],
  templateUrl: './admin-order.component.html',
  providers: [DatePipe]
})
export class AdminOrderComponent implements OnInit {
  @ViewChild('orderModal') orderModal!: ModalComponent;

  orders: AdminOrder[] = [];
  summary: AdminOrderSummaryResponse['data'] | null = null;
  selectedOrder: AdminOrder | null = null;
  isLoading = false;
  error: string | null = null;

  // Filtros de búsqueda
  searchTerm = '';
  statusFilter: 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' = 'all';
  dateFilter = '';
  dateField: 'delivery' | 'creation' = 'delivery';
  paymentMethod = '';
  deliveryOption = '';
  minTotal: number | null = null;
  maxTotal: number | null = null;
  isUrgent: boolean | null = null;

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
      left: 'title',
      center: '',
      right: 'today prev,next'
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
      list: 'Lista'
    },
    dayHeaderClassNames: 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium',
    dayCellClassNames: 'hover:bg-gray-50 dark:hover:bg-gray-700',
    eventClassNames: 'cursor-pointer text-xs font-medium',
    eventContent: this.customEventContent.bind(this),
    eventDisplay: 'block',
    eventTimeFormat: { 
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    },
    themeSystem: 'bootstrap5'
  };

  // Método para personalizar el contenido de los eventos
  private customEventContent(arg: any): { html: string } {
    const order = arg.event.extendedProps.order;
    const statusColor = this.getEventColor(order.order_status);
    
    return {
      html: `
        <div class="p-1 rounded border-l-4" style="border-color: ${statusColor}">
          <div class="font-semibold truncate">#${order.order_id}</div>
          <div class="text-xs truncate">${order.customer_name}</div>
        </div>
      `
    };
  }

  // Formateador de moneda
  private currencyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
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

  // Cargar órdenes con filtros
  loadOrders(): void {
    this.isLoading = true;
    const startDate = moment().startOf('month').format('YYYY-MM-DD');
    const endDate = moment().endOf('month').format('YYYY-MM-DD');
    this.dateFilter = `${startDate},${endDate}`;

    this.orderService.getOrders(
      1,
      50,
      this.searchTerm,
      this.statusFilter,
      this.dateFilter,
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
      }
    });
  }

  // Cargar estadísticas
  loadSummary(): void {
    this.orderService.getOrderSummary().subscribe({
      next: (response: AdminOrderSummaryResponse) => {
        this.summary = response.data;
        console.log(this.summary)
      },
      error: (err) => {
        this.error = err.message;
        this.toastService.showToast(err.message || 'Error al cargar el resumen', 'error');
      }
    });
  }

  // Cargar órdenes para una fecha específica
  handleDateClick(arg: any): void {
    const date = moment(arg.date).format('YYYY-MM-DD');
    this.orderService.getOrdersByDate(date, this.dateField).subscribe({
      next: (response: AdminOrdersByDateResponse) => {
        this.orders = response.data;
        this.toastService.showToast(`Órdenes cargadas para ${this.formatDate(date)}`, 'info');
      },
      error: (err) => {
        this.error = err.message;
        this.toastService.showToast(err.message || 'Error al cargar órdenes por fecha', 'error');
      }
    });
  }

  // Mostrar detalles de una orden
  handleEventClick(arg: any): void {
    const orderId = parseInt(arg.event.id, 10);
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
        this.updateCalendarEvents({}); // Actualizar eventos si es necesario
        this.toastService.showToast('Estado de la orden actualizado exitosamente', 'success');
      },
      error: (err) => {
        this.error = err.message;
        this.toastService.showToast(err.message || 'Error al actualizar el estado', 'error');
      }
    });
  }

  // Actualizar eventos del calendario
  private updateCalendarEvents(ordersByDay: { [date: string]: AdminOrder[] }): void {
    const events: EventInput[] = [];
    Object.keys(ordersByDay).forEach(date => {
      ordersByDay[date].forEach(order => {
        events.push({
          id: order.order_id.toString(),
          title: `Orden #${order.order_id} - ${order.customer_name}`,
          start: date,
          backgroundColor: this.getEventColor(order.order_status),
          extendedProps: { order }
        });
      });
    });
    this.calendarOptions.events = events;
  }

  // Obtener color según el estado - Versión actualizada
  private getEventColor(status: string): string {
    switch (status) {
      case 'pending': return '#f59e0b'; // amber-500
      case 'processing': return '#3b82f6'; // blue-500
      case 'shipped': return '#8b5cf6'; // violet-500
      case 'delivered': return '#10b981'; // emerald-500
      default: return '#6b7280'; // gray-500
    }
  }

  // Aplicar filtros
  applyFilters(): void {
    this.loadOrders();
  }

  // Formatear fecha
  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd MMM yyyy', 'es-MX') || date;
  }

  // Formatear moneda
  formatCurrency(amount: number): string {
    return this.currencyFormatter.format(amount);
  }
}