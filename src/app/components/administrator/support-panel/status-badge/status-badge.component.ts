import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupportInquiryService } from '../../../../services/support-inquiry.service';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="service.getStatusClass(status)">
      {{ service.getStatusText(status) }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status!: string;
  constructor(public service: SupportInquiryService) {}
}