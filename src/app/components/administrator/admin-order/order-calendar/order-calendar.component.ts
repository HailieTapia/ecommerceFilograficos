import { Component, Input, Output, EventEmitter, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import { DateClickArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { AdminOrder } from '../../../services/admin-order.service';
import { ToastService } from '../../../services/toastService';

@Component({
  selector: 'app-order-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './order-calendar.component.html',
  styleUrls: ['./order-calendar.component.css'],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderCalendarComponent {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  @Input() currentDate: Date = new Date();
  @Input() selectedDate: Date | null = null;
  @Input() orders: AdminOrder[] = [];
  @Input() dateFilter: 'delivery' | 'creation' = 'delivery';
  @Output() dateSelected = new EventEmitter<Date>();
  @Output() orderSelected = new EventEmitter<AdminOrder>();

  viewMode: string = 'dayGridMonth';

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
    headerToolbar: false,
    events: [],
    dayCellContent: this.renderDayCellContent.bind(this),
    eventContent: this.renderEventContent.bind(this),
    dateClick: this.handleDateClick.bind(this),
    eventClick: this.handleEventClick.bind(this),
    datesSet: this.handleDatesSet.bind(this),
    locale: 'es',
    firstDay: 1
  };

  constructor(private datePipe: DatePipe, private toastService: ToastService) {}

  ngOnChanges(): void {
    this.updateCalendarEvents();
  }

  getOrdersForDate(date: Date): AdminOrder[] {
    return this.orders.filter((order) => {
      const orderDate = this.dateFilter === 'delivery'
        ? new Date(order.estimated_delivery_date)
        : new Date(order.created_at);
      return this.datePipe.transform(orderDate, 'yyyy-MM-dd') === this.datePipe.transform(date, 'yyyy-MM-dd');
    });
  }

  updateCalendarEvents(): void {
    const events = this.orders.map(order => {
      const date = this.dateFilter === 'delivery' ? order.estimated_delivery_date : order.created_at;
      return {
        id: order.order_id.toString(),
        title: `#${order.order_id} - ${order.customer_name}`,
        date: this.datePipe.transform(new Date(date), 'yyyy-MM-dd')!,
        classNames: [this.getStatusColor(order.order_status)],
        extendedProps: { order }
      };
    });
    this.calendarOptions = { ...this.calendarOptions, events };
  }

  renderDayCellContent(arg: any): any {
    const orders = this.getOrdersForDate(arg.date);
    const isToday = arg.date.toDateString() === new Date().toDateString();
    const isSelected = this.selectedDate && arg.date.toDateString() === this.selectedDate.toDateString();
    return {
      html: `
        <div class="text-sm font-medium mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : ''} ${isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''}">
          ${arg.dayNumberText}
        </div>
        ${orders.length > 0 ? `
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            orders.length > 5 ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
            orders.length > 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' :
            'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
          }">
            ${orders.length} orden${orders.length !== 1 ? 'es' : ''}
          </span>
        ` : ''}
      `
    };
  }

  renderEventContent(arg: any): any {
    const order: AdminOrder = arg.event.extendedProps['order'];
    return {
      html: `
        <div class="p-1 text-xs rounded border ${this.getStatusColor(order.order_status)} truncate cursor-pointer" title="#${order.order_id} - ${order.customer_name} - ${this.formatCurrency(order.total)}">
          <i class="fas ${this.getStatusIcon(order.order_status)} mr-1"></i>
          #${order.order_id} - ${order.customer_name}
        </div>
      `
    };
  }

  handleDateClick(arg: DateClickArg): void {
    this.selectedDate = arg.date;
    this.dateSelected.emit(arg.date);
    this.toastService.showToast(`Fecha seleccionada: ${this.datePipe.transform(arg.date, 'dd/MM/yyyy')}`, 'info');
  }

  handleEventClick(arg: EventClickArg): void {
    const order: AdminOrder = arg.event.extendedProps['order'];
    this.orderSelected.emit(order);
  }

  handleDatesSet(arg: any): void {
    this.currentDate = arg.view.currentStart;
    this.dateSelected.emit(this.currentDate);
  }

  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-800 dark:text-yellow-100 dark:border-yellow-700',
      processing: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-700',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-800 dark:text-purple-100 dark:border-purple-700',
      delivered: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-800 dark:text-green-100 dark:border-green-700'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700';
  }

  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      pending: 'fa-clock',
      processing: 'fa-box',
      shipped: 'fa-truck',
      delivered: 'fa-check-circle'
    };
    return statusIcons[status] || 'fa-warning';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  previousMonth(): void {
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.prev();
    this.currentDate = calendarApi.getDate();
    this.dateSelected.emit(this.currentDate);
  }

  nextMonth(): void {
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.next();
    this.currentDate = calendarApi.getDate();
    this.dateSelected.emit(this.currentDate);
  }

  goToToday(): void {
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.today();
    this.currentDate = calendarApi.getDate();
    this.dateSelected.emit(this.currentDate);
  }

  changeView(view: string): void {
    this.viewMode = view;
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.changeView(view);
    this.currentDate = calendarApi.getDate();
    this.dateSelected.emit(this.currentDate);
  }
}