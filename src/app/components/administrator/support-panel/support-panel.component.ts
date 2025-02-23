import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { SupportInquiryService } from '../../services/support-inquiry.service';
import { StatusCardsComponent } from './status-cards/status-cards.component';
import { ConsultationRowComponent } from './consultation-row/consultation-row.component';
import { StatusBadgeComponent } from './status-badge/status-badge.component';
import { ConsultationDetailsComponent } from './consultation-details/consultation-details.component';
import { PaginationComponent } from '../pagination/pagination.component'; // Asegúrate de que la ruta sea correcta
import {FiltersPanelComponent} from './filters-panel/filters-panel.component';

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
    PaginationComponent,
    FiltersPanelComponent
  ],
  templateUrl: './support-panel.component.html',
})
export class SupportPanelComponent {
  consultationCounts: any = {};
  consultations: any[] = [];
  filteredConsultations: any[] = []; // Lista filtrada para mostrar
  selectedConsultationId: string | null = null;
  showModal: boolean = false;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  // Nueva propiedad para el término de búsqueda
  searchQuery: string = '';

  // Nueva propiedad para controlar la visibilidad de los filtros
  showFilters: boolean = false;

  constructor(private supportService: SupportInquiryService) {}

  ngOnInit(): void {
    this.loadData();
  }

  public loadData(): void {
    // Cargar estadísticas
    this.supportService.getConsultationCountsByStatus().subscribe({
      next: (res) => this.processCounts(res.consultationCounts),
      error: (e) => console.error('Error counts:', e),
    });

    // Cargar consultas paginadas
    this.supportService.getAllConsultations(this.currentPage, this.itemsPerPage).subscribe({
      next: (res) => {
        this.consultations = res.consultations;
        this.filteredConsultations = this.consultations; // Inicializar la lista filtrada
        this.totalItems = res.total;
      },
      error: (e) => console.error('Error consultations:', e),
    });
  }

  // Función para manejar la búsqueda
  onSearch(): void {
    if (!this.searchQuery) {
      this.filteredConsultations = this.consultations; // Si no hay búsqueda, mostrar todos
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredConsultations = this.consultations.filter((consultation) => {
      return (
        consultation.user_name.toLowerCase().includes(query) || // Buscar en el nombre
        consultation.user_email.toLowerCase().includes(query) || // Buscar en el email
        consultation.subject.toLowerCase().includes(query) // Buscar en el asunto
      );
    });
  }

  // Alternar la visibilidad de los filtros
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
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
  
  onFiltersChanged(filters: any): void {
    // Aplicar filtros y luego búsqueda
    this.supportService.getFilteredConsultations(filters, this.currentPage, this.itemsPerPage).subscribe({
      next: (response) => {
        this.consultations = response.consultations;
        this.filteredConsultations = this.consultations; // Reiniciar la lista filtrada
        this.onSearch(); // Aplicar búsqueda después de los filtros
        this.totalItems = response.total;
      },
      error: (error) => {
        console.error('Error al obtener consultas filtradas:', error);
      },
    });
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