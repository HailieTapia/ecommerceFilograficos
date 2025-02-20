import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupportInquiryService } from '../../../services/support-inquiry.service';

@Component({
  selector: 'app-consultation-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './consultation-details.component.html',
})
export class ConsultationDetailsComponent implements OnInit {
  @Input() consultationId!: string; // Usamos el operador de aserción no nula (!)
  consultation: any = null; // Inicializamos consultation como null

  constructor(private supportService: SupportInquiryService) {}

  ngOnInit(): void {
    this.loadConsultationDetails();
  }

  loadConsultationDetails(): void {
    this.supportService.getConsultationById(this.consultationId).subscribe({
      next: (res) => {
        this.consultation = res.consultation; // Asegúrate de acceder a res.consultation
      },
      error: (e) => console.error('Error loading consultation details:', e)
    });
  }

  // Reemplazamos getStatusColor por getStatusClass del servicio
  getStatusClass(status: string): string {
    return this.supportService.getStatusClass(status);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}