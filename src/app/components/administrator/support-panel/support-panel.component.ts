import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { SupportInquiryService } from '../../services/support-inquiry.service';
import { StatusCardsComponent } from './status-cards/status-cards.component';
import { ConsultationRowComponent } from './consultation-row/consultation-row.component';
import { StatusBadgeComponent } from './status-badge/status-badge.component';
import { ConsultationDetailsComponent } from './consultation-details/consultation-details.component';
import { PaginationComponent } from '../pagination/pagination.component'; // Asegúrate de que la ruta sea correcta

@Component({
  selector: 'app-support-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusCardsComponent, 
    ConsultationRowComponent, 
    StatusBadgeComponent, 
    ConsultationDetailsComponent,
    PaginationComponent // Añadir el componente de paginación
  ],
  templateUrl: './support-panel.component.html',
})
export class SupportPanelComponent {
  consultationCounts: any = {};
  consultations: any[] = [];
  selectedConsultationId: string | null = null;
  showModal: boolean = false;
  
  // Variables de paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  constructor(private supportService: SupportInquiryService) {}

  ngOnInit(): void {
    this.loadData();
  }

  public loadData(): void {
    // Cargar estadísticas
    this.supportService.getConsultationCountsByStatus().subscribe({
      next: (res) => this.processCounts(res.consultationCounts),
      error: (e) => console.error('Error counts:', e)
    });

    // Cargar consultas paginadas
    this.supportService.getAllConsultationsForPagination(this.currentPage, this.itemsPerPage)
      .subscribe({
        next: (res) => {
          this.consultations = res.consultations;
          this.totalItems = res.total;
        },
        error: (e) => console.error('Error consultations:', e)
      });
  }

  // Manejar cambio de página
  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadData();
  }

  // Manejar cambio de elementos por página
  onItemsPerPageChange(): void {
    this.currentPage = 1; // Resetear a la primera página
    this.loadData();
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