import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminOrderSummary } from '../../../services/admin-order.service';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-summary.component.html'
})
export class OrderSummaryComponent {
  @Input() summary: AdminOrderSummary | null = null;
}