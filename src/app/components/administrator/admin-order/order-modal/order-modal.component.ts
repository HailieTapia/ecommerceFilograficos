import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AdminOrder, UpdateOrderStatusRequest } from '../../../services/admin-order.service';
import { ToastService } from '../../../services/toastService';

@Component({
  selector: 'app-order-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './order-modal.component.html',
  styleUrls: ['./order-modal.component.css'],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderModalComponent {
  @Input() order: AdminOrder | null = null;
  @Output() updateStatus = new EventEmitter<UpdateOrderStatusRequest>();
  @Output() close = new EventEmitter<void>();

  paymentStatusColors: { [key: string]: string } = {
    pending: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
    validated: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
    failed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
  };

  constructor(
    public dialogRef: MatDialogRef<OrderModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { order: AdminOrder },
    private datePipe: DatePipe,
    private toastService: ToastService
  ) {
    this.order = data.order;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  onStatusChange(newStatus: string): void {
    if (this.order) {
      this.order.order_status = newStatus as any;
      this.updateStatus.emit({ newStatus: newStatus as 'pending' | 'processing' | 'shipped' | 'delivered' });
    }
  }

  onClose(): void {
    this.close.emit();
    this.dialogRef.close();
  }

  viewDetails(): void {
    this.toastService.showToast('Funcionalidad de detalles completos en desarrollo', 'info');
  }
}