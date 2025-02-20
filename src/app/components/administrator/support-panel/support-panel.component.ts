import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupportInquiryService } from '../../services/support-inquiry.service';
import { StatusCardsComponent } from './status-cards/status-cards.component';
import { ConsultationRowComponent } from './consultation-row/consultation-row.component';
import { StatusBadgeComponent } from './status-badge/status-badge.component';
import { ConsultationDetailsComponent } from './consultation-details/consultation-details.component';

@Component({
  selector: 'app-support-panel',
  standalone: true,
  imports: [CommonModule, StatusCardsComponent, ConsultationRowComponent, StatusBadgeComponent, ConsultationDetailsComponent],
  templateUrl: './support-panel.component.html',
})
export class SupportPanelComponent {
  consultationCounts: any = {};
  consultations: any[] = [];
  selectedConsultationId: string | null = null;
  showModal: boolean = false;

  constructor(private supportService: SupportInquiryService) {}

  ngOnInit(): void {
    this.loadData();
  }

  public loadData(): void {
    this.supportService.getConsultationCountsByStatus().subscribe({
      next: (res) => this.processCounts(res.consultationCounts),
      error: (e) => console.error('Error counts:', e)
    });

    this.supportService.getAllConsultations().subscribe({
      next: (res) => this.consultations = res.consultations,
      error: (e) => console.error('Error consultations:', e)
    });
  }

  private processCounts(counts: any[]): void {
    this.consultationCounts = counts.reduce((acc, curr) => {
      acc[curr.status] = curr.count;
      return acc;
    }, {});
  }

  openModal(consultationId: string): void {
    this.selectedConsultationId = consultationId;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedConsultationId = null;
  }
}