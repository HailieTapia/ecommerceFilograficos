import { Component, OnInit, LOCALE_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { SupportInquiryService } from '../../../services/support-inquiry.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { FiltersPanelComponent } from './filters-panel/filters-panel.component';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { forkJoin } from 'rxjs';

// Registrar los datos de localización para español
registerLocaleData(localeEs);

@Component({
  selector: 'app-support-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginationComponent,
    FiltersPanelComponent,
    DatePipe
  ],
  templateUrl: './support-panel.component.html',
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
})
export class SupportPanelComponent implements OnInit {
  consultationCounts: any = {};
  consultations: any[] = [];
  selectedConsultationId: string | null = null;
  consultation: any = null;
  showModal: boolean = false;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  searchQuery: string = '';
  showFilters: boolean = false;
  currentFilters: any = {};
  editingState: { [key: string]: { isEditing: boolean, editState: { status: string, response_channel: string }, errorMessage: string } } = {};

  constructor(
    private supportService: SupportInquiryService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  public loadData(): void {
    this.supportService.getConsultationCountsByStatus().subscribe({
      next: (res) => this.processCounts(res.consultationCounts),
      error: (e) => console.error('Error counts:', e),
    });

    this.loadConsultations();
  }

  private loadConsultations(): void {
    const filters = { ...this.currentFilters };
    if (this.searchQuery) {
      filters.search = this.searchQuery;
    }

    this.supportService.getFilteredConsultations(filters, this.currentPage, this.itemsPerPage).subscribe({
      next: (res) => {
        this.consultations = res.consultations;
        this.totalItems = res.total;
        // Initialize editing state for each consultation
        this.consultations.forEach(consultation => {
          if (!this.editingState[consultation.inquiry_id]) {
            this.editingState[consultation.inquiry_id] = {
              isEditing: false,
              editState: { status: consultation.status, response_channel: consultation.response_channel },
              errorMessage: ''
            };
          }
        });
      },
      error: (e) => console.error('Error al cargar consultas:', e),
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadConsultations();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadConsultations();
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadConsultations();
  }

  private processCounts(counts: any[]): void {
    this.consultationCounts = counts.reduce((acc, curr) => {
      acc[curr.status] = curr.count;
      return acc;
    }, {});
  }

  onFiltersChanged(filters: any): void {
    this.currentFilters = filters;
    this.currentPage = 1;
    this.loadConsultations();
  }

  openModal(consultationId: string): void {
    this.selectedConsultationId = consultationId;
    this.showModal = true;
    this.loadConsultationDetails();
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedConsultationId = null;
    this.consultation = null;
  }

  private loadConsultationDetails(): void {
    if (this.selectedConsultationId) {
      this.supportService.getConsultationById(this.selectedConsultationId).subscribe({
        next: (res) => {
          this.consultation = res.consultation;
        },
        error: (e) => console.error('Error loading consultation details:', e)
      });
    }
  }

  handleEdit(consultationId: string): void {
    this.editingState[consultationId].isEditing = true;
    this.editingState[consultationId].editState = {
      status: this.consultations.find(c => c.inquiry_id === consultationId)!.status,
      response_channel: this.consultations.find(c => c.inquiry_id === consultationId)!.response_channel
    };
    this.editingState[consultationId].errorMessage = '';
  }

  handleSave(consultationId: string): void {
    const consultation = this.consultations.find(c => c.inquiry_id === consultationId)!;
    const { editState } = this.editingState[consultationId];
    const isStatusChanged = consultation.status !== editState.status;
    const isResponseChannelChanged = consultation.response_channel !== editState.response_channel;

    if (isStatusChanged && !this.supportService.isValidStatusTransition(consultation.status, editState.status)) {
      this.editingState[consultationId].errorMessage = 'No se puede cambiar el estado a uno anterior...';
      setTimeout(() => {
        this.editingState[consultationId].errorMessage = '';
        this.resetEditState(consultationId);
      }, 3000);
      return;
    }

    if (isStatusChanged && !confirm(this.getConfirmationMessage(consultationId))) return;

    const updates = [];
    if (isStatusChanged) {
      updates.push(this.supportService.updateConsultationStatus(consultationId, { status: editState.status }));
    }
    if (isResponseChannelChanged) {
      updates.push(this.supportService.updateConsultationResponseChannel(consultationId, { response_channel: editState.response_channel }));
    }

    if (updates.length > 0) {
      forkJoin(updates).subscribe({
        next: () => {
          this.loadData(); // Refresh data after save
          this.editingState[consultationId].isEditing = false;
        },
        error: (error) => {
          console.error('Error saving changes:', error);
          this.editingState[consultationId].errorMessage = 'Error al guardar cambios...';
        }
      });
    } else {
      this.editingState[consultationId].isEditing = false;
    }
  }

  private getConfirmationMessage(consultationId: string): string {
    const { editState } = this.editingState[consultationId];
    const consultation = this.consultations.find(c => c.inquiry_id === consultationId)!;
    return `¿Estás seguro de cambiar el estado de "${this.getStatusText(consultation.status)}" a "${this.getStatusText(editState.status)}"? Esta acción es irreversible.`;
  }

  private resetEditState(consultationId: string): void {
    const consultation = this.consultations.find(c => c.inquiry_id === consultationId)!;
    this.editingState[consultationId].editState = {
      status: consultation.status,
      response_channel: consultation.response_channel
    };
    this.editingState[consultationId].isEditing = false;
  }

  getResponseChannelIcon(channel: string): string {
    const icons: { [key: string]: string } = {
      email: 'fas fa-envelope',
      whatsapp: 'fab fa-whatsapp',
      phone: 'fas fa-phone'
    };
    return icons[channel] || 'fas fa-question-circle';
  }

  getFormattedDate(date: string, withTime: boolean = false): string {
    const format = withTime ? "d 'de' MMMM 'de' yyyy HH:mm" : "d 'de' MMMM 'de' yyyy";
    return this.datePipe.transform(date, format, undefined, 'es') || 'Fecha no disponible';
  }

  public getStatusClass(status: string): string {
    return this.supportService.getStatusClass(status);
  }

  public getStatusText(status: string): string {
    return this.supportService.getStatusText(status);
  }
}