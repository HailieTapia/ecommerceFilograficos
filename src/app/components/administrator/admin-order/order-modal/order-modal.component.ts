import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AdminOrder, AdminOrderService, UpdateOrderStatusRequest } from '../../../services/admin-order.service';
import { ModalComponent } from '../../../../modal/modal.component';
import { ToastService } from '../../../services/toastService';

@Component({
  selector: 'app-order-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModalComponent
  ],
  templateUrl: './order-modal.component.html',
  providers: [DatePipe]
})
export class OrderModalComponent {
  @ViewChild('orderModal') orderModal!: ModalComponent;

  @Input() order: AdminOrder | null = null;
  @Output() updateStatus = new EventEmitter<UpdateOrderStatusRequest>();
  @Output() close = new EventEmitter<void>();

  orderForm: FormGroup;
  paymentStatusColors: { [key: string]: string } = {
    pending: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
    validated: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
    failed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
  };

  constructor(
    private fb: FormBuilder,
    private orderService: AdminOrderService,
    private datePipe: DatePipe,
    private toastService: ToastService
  ) {
    this.orderForm = this.fb.group({
      order_status: ['']
    });

    this.orderForm.get('order_status')?.valueChanges.subscribe(status => {
      if (this.order && status) {
        this.updateOrderStatus({ newStatus: status });
      }
    });
  }

  ngOnChanges(): void {
    if (this.order) {
      this.orderForm.patchValue({
        order_status: this.order.order_status
      });
      this.orderModal.open();
    }
  }

  updateOrderStatus(request: UpdateOrderStatusRequest): void {
    if (this.order) {
      this.orderService.updateOrderStatus(this.order.order_id, request).subscribe({
        next: () => {
          this.updateStatus.emit(request);
          this.toastService.showToast(`Estado de la orden actualizado a ${request.newStatus}`, 'success');
        },
        error: (err) => {
          this.toastService.showToast('Error al actualizar el estado de la orden', 'error');
        }
      });
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  trackByDetailId(index: number, detail: any): number {
    return detail.order_detail_id;
  }

  closeModal(): void {
    this.close.emit();
    this.orderModal.close();
  }

  editOrder(): void {
    this.toastService.showToast('Funcionalidad de edición en desarrollo', 'info');
  }

  viewDetails(): void {
    this.toastService.showToast('Funcionalidad de detalles completos en desarrollo', 'info');
  }
}