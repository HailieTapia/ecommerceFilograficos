import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
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
import { format, startOfMonth, endOfMonth, isSameDay, addDays } from 'date-fns';
import { Subscription } from 'rxjs';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';

@Component({
  selector: 'app-admin-order',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule, ModalComponent],
  templateUrl: './admin-order.component.html',
  styleUrls: ['./admin-order.component.css'],
  providers: [DatePipe, CurrencyPipe]
})
export class AdminOrderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('orderModal') orderModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

  orders: AdminOrder[] = [];
  summary: AdminOrderSummaryResponse['data'] | null = null;
  selectedOrder: AdminOrder | null = null;
  selectedDate: Date | null = null;
  isLoading = false;
  tempOrderStatus: OrderStatus | null = null;
  confirmAction: (() => void) | null = null;
  confirmModalTitle: string = '';
  confirmModalMessage: string = '';
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';

  // Filtros
  searchTerm = '';
  statusFilter: 'all' | OrderStatus = 'all';
  dateField: 'delivery' | 'creation' = 'delivery';
  paymentMethod = '';
  deliveryOption = '';
  minTotal: number | null = null;
  maxTotal: number | null = null;
  isUrgent: boolean | null = null;

  private subscriptions: Subscription = new Subscription();

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
    if (!this.orderModal || !this.confirmModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
    this.updateCalendarEvents();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  customEventContent(arg: any): { html: string } {
    const order = arg.event.extendedProps['order'] as AdminOrder;
    const statusColor = this.getEventColor(order.order_status);
    const maxLength = 20;
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
    const dateStr = format(arg.date, 'yyyy-MM-dd');
    const dayOrders = this.orders.filter(order => {
      const orderDate = this.dateField === 'delivery' ? order.estimated_delivery_date : order.created_at;
      return format(new Date(orderDate), 'yyyy-MM-dd') === dateStr;
    });
    const isToday = isSameDay(arg.date, new Date());
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
    const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    this.subscriptions.add(
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
          this.toastService.showToast('Órdenes cargadas exitosamente.', 'success');
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar las órdenes';
          this.isLoading = false;
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  loadSummary(): void {
    this.subscriptions.add(
      this.orderService.getOrderSummary().subscribe({
        next: (response: AdminOrderSummaryResponse) => {
          this.summary = response.data;
          this.toastService.showToast('Resumen cargado exitosamente.', 'success');
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar el resumen';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  handleDateClick(arg: DateClickArg): void {
    this.selectedDate = arg.date;
    const date = format(arg.date, 'yyyy-MM-dd');
    this.subscriptions.add(
      this.orderService.getOrdersByDate(date, this.dateField).subscribe({
        next: (response: AdminOrdersByDateResponse) => {
          this.orders = response.data;
          this.toastService.showToast(`Órdenes cargadas para ${this.formatDate(date)}`, 'info');
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar órdenes por fecha';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  handleEventClick(arg: EventClickArg): void {
    const orderId = parseInt(arg.event.id, 10);
    this.loadOrderDetails(orderId);
  }

  handleOrderClick(orderId: number): void {
    this.loadOrderDetails(orderId);
  }

  private loadOrderDetails(orderId: number): void {
    this.subscriptions.add(
      this.orderService.getOrderById(orderId).subscribe({
        next: (response: AdminOrderResponse) => {
          this.selectedOrder = response.data;
          this.tempOrderStatus = response.data.order_status;
          this.orderModal.title = `Detalles de la Orden #${response.data.order_id}`;
          this.orderModal.modalType = 'info';
          this.orderModal.isConfirmModal = false;
          this.orderModal.open();
          this.toastService.showToast('Detalles de la orden cargados exitosamente.', 'success');
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar detalles de la orden';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  openConfirmModal(title: string, message: string, modalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default', action: () => void) {
    if (!this.confirmModal) {
      this.toastService.showToast('Error: Modal de confirmación no inicializado', 'error');
      return;
    }
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmModalType = modalType;
    this.confirmAction = action;
    this.confirmModal.title = title;
    this.confirmModal.modalType = modalType;
    this.confirmModal.isConfirmModal = true;
    this.confirmModal.confirmText = 'Confirmar';
    this.confirmModal.cancelText = 'Cancelar';
    this.confirmModal.open();
  }

  handleConfirm(): void {
    if (this.confirmAction) {
      this.confirmAction();
      this.confirmAction = null;
    }
  }

  confirmUpdateStatus(): void {
    if (!this.selectedOrder || !this.tempOrderStatus) {
      this.toastService.showToast('No se ha seleccionado una orden o estado.', 'error');
      return;
    }
    if (this.tempOrderStatus === this.selectedOrder.order_status) {
      this.orderModal.close();
      this.toastService.showToast('No se han realizado cambios en el estado.', 'info');
      return;
    }
    this.openConfirmModal(
      'Confirmar Cambio de Estado',
      `¿Estás seguro de cambiar el estado de la orden #${this.selectedOrder.order_id} a ${this.statusTranslations[this.tempOrderStatus]}?`,
      'warning',
      () => {
        this.updateOrderStatus(this.selectedOrder!.order_id, this.tempOrderStatus!);
        this.orderModal.close();
      }
    );
  }

  updateOrderStatus(orderId: number, newStatus: OrderStatus): void {
    const request: UpdateOrderStatusRequest = { newStatus };
    this.subscriptions.add(
      this.orderService.updateOrderStatus(orderId, request).subscribe({
        next: (response: any) => {
          this.orders = this.orders.map(order =>
            order.order_id === orderId ? response.data : order
          );
          if (this.selectedOrder?.order_id === orderId) {
            this.selectedOrder = response.data;
            this.tempOrderStatus = response.data.order_status;
          }
          this.updateCalendarEvents();
          this.toastService.showToast('Estado de la orden actualizado exitosamente.', 'success');
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al actualizar el estado';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  private updateCalendarEvents(): void {
    const events: EventInput[] = this.orders.map(order => ({
      id: order.order_id.toString(),
      title: `#${order.order_id} - ${order.customer_name}`,
      start: this.dateField === 'delivery' ? order.estimated_delivery_date : order.created_at,
      end: this.dateField === 'delivery' ? format(addDays(new Date(order.estimated_delivery_date), 1), 'yyyy-MM-dd') : format(addDays(new Date(order.created_at), 1), 'yyyy-MM-dd'),
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
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    return this.datePipe.transform(dateStr, 'dd MMM yyyy', 'es-MX') || dateStr;
  }

  formatCurrency(amount: number): string {
    return this.currencyPipe.transform(amount, 'MXN', 'symbol', '1.2-2', 'es-MX') || '0';
  }
}