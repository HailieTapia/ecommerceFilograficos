import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { SupportInquiryService } from '../../services/support-inquiry.service';
import { StatusCardsComponent } from './status-cards/status-cards.component';
import { ConsultationRowComponent } from './consultation-row/consultation-row.component';
import { StatusBadgeComponent } from './status-badge/status-badge.component';
import { ConsultationDetailsComponent } from './consultation-details/consultation-details.component';
import { PaginationComponent } from '../pagination/pagination.component';
import { FiltersPanelComponent } from './filters-panel/filters-panel.component';

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
  selectedConsultationId: string | null = null;
  showModal: boolean = false;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  // Propiedad para el término de búsqueda
  searchQuery: string = '';

  // Propiedad para controlar la visibilidad de los filtros
  showFilters: boolean = false;

  // Almacenar los filtros actuales
  currentFilters: any = {};

  constructor(private supportService: SupportInquiryService) {}

  ngOnInit(): void {
    this.loadData();
  }

  // Cargar datos (consultas y estadísticas)
  public loadData(): void {
    // Cargar estadísticas
    this.supportService.getConsultationCountsByStatus().subscribe({
      next: (res) => this.processCounts(res.consultationCounts),
      error: (e) => console.error('Error counts:', e),
    });

    // Cargar consultas con filtros y búsqueda actuales
    this.loadConsultations();
  }

  // Nueva función para cargar consultas basada en filtros y búsqueda
  private loadConsultations(): void {
    const filters = { ...this.currentFilters };
    if (this.searchQuery) {
      filters.search = this.searchQuery; // Añadir búsqueda a los filtros si existe
    }

    this.supportService.getFilteredConsultations(filters, this.currentPage, this.itemsPerPage).subscribe({
      next: (res) => {
        this.consultations = res.consultations;
        this.totalItems = res.total;
      },
      error: (e) => console.error('Error al cargar consultas:', e),
    });
  }

  // Manejar la búsqueda
  onSearch(): void {
    this.currentPage = 1; // Resetear a la primera página al buscar
    this.loadConsultations();
  }

  // Alternar la visibilidad de los filtros
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  // Manejar cambio de página
  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadConsultations();
  }

  // Manejar cambio de elementos por página
  onItemsPerPageChange(): void {
    this.currentPage = 1; // Resetear a la primera página
    this.loadConsultations();
  }

  private processCounts(counts: any[]): void {
    this.consultationCounts = counts.reduce((acc, curr) => {
      acc[curr.status] = curr.count;
      return acc;
    }, {});
  }
  
  // Manejar cambios en los filtros
  onFiltersChanged(filters: any): void {
    this.currentFilters = filters; // Almacenar los filtros actuales
    this.currentPage = 1; // Resetear a la primera página
    this.loadConsultations();
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