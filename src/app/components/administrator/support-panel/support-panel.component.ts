import { Component, OnInit, LOCALE_ID, ViewChild, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SupportInquiryService } from '../../../services/support-inquiry.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { ModalComponent } from '../../reusable/modal/modal.component';
import { ToastService } from '../../../services/toastService';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Registrar los datos de localización para español
registerLocaleData(localeEs);

@Component({
  selector: 'app-support-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
    ModalComponent,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    DatePipe
  ],
  templateUrl: './support-panel.component.html',
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
})
export class SupportPanelComponent implements OnInit, OnDestroy {
  @ViewChild('detailsModal') detailsModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

  consultationCounts: any = {};
  consultations: any[] = [];
  selectedConsultationId: string | null = null;
  consultation: any = null;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  searchQuery: string = '';
  showFilters: boolean = false;
  currentFilters: any = {};
  editingState: { [key: string]: { isEditing: boolean, editState: { status: string, response_channel: string }, errorMessage: string } } = {};
  private destroy$ = new Subject<void>();
  confirmModalTitle = '';
  confirmModalMessage = '';
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';
  confirmModalText = 'Confirmar';
  cancelModalText = 'Cancelar';
  confirmAction: (() => void) | null = null;
  private loading = false;
  filtersForm: FormGroup;
  activeFilters: { key: string; value: string }[] = [];

  constructor(
    private supportService: SupportInquiryService,
    private datePipe: DatePipe,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.filtersForm = this.fb.group({
      status: [''],
      contact_channel: [''],
      response_channel: [''],
      user_id: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
    // Cargar filtros guardados en localStorage
    const savedFilters = localStorage.getItem('supportFilters');
    if (savedFilters) {
      const filters = JSON.parse(savedFilters);
      this.filtersForm.patchValue(filters);
      this.updateActiveFilters(filters);
    }
    // Escuchar cambios en el formulario
    this.filtersForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((filters) => {
      this.updateActiveFilters(filters);
      this.onFiltersChanged(filters);
      localStorage.setItem('supportFilters', JSON.stringify(filters));
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public loadData(): void {
    if (this.loading) return;
    this.loading = true;
    this.supportService.getConsultationCountsByStatus().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.processCounts(res.consultationCounts);
        this.loading = false;
      },
      error: (e) => {
        this.toastService.showToast('Error al cargar conteos: ' + e.message, 'error');
        this.loading = false;
      }
    });

    this.loadConsultations();
  }

  private loadConsultations(): void {
    const filters = { ...this.currentFilters };
    if (this.searchQuery) {
      filters.search = this.searchQuery;
    }

    this.supportService.getFilteredConsultations(filters, this.currentPage, this.itemsPerPage).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.consultations = res.consultations;
        this.totalItems = res.total;
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
      error: (e) => {
        this.toastService.showToast('Error al cargar consultas: ' + e.message, 'error');
      }
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
    this.loadConsultationDetails();
  }

  closeModal(): void {
    if (this.detailsModal) {
      this.detailsModal.close();
    }
    this.selectedConsultationId = null;
    this.consultation = null;
  }

  private loadConsultationDetails(): void {
    if (this.selectedConsultationId) {
      this.supportService.getConsultationById(this.selectedConsultationId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.consultation = res.consultation;
          if (this.detailsModal) {
            this.detailsModal.modalType = 'info';
            this.detailsModal.open();
          }
        },
        error: (e) => this.toastService.showToast('Error al cargar detalles de consulta: ' + e.message, 'error')
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
      this.toastService.showToast('No se puede cambiar el estado a uno anterior...', 'error');
      setTimeout(() => this.resetEditState(consultationId), 3000);
      return;
    }

    if (isStatusChanged) {
      this.openConfirmModal(
        'Confirmar Cambio de Estado',
        this.getConfirmationMessage(consultationId),
        'warning',
        () => {
          this.performSave(consultationId, isStatusChanged, isResponseChannelChanged);
          if (this.confirmModal) this.confirmModal.close();
        }
      );
    } else {
      this.performSave(consultationId, isStatusChanged, isResponseChannelChanged);
    }
  }

  private performSave(consultationId: string, isStatusChanged: boolean, isResponseChannelChanged: boolean): void {
    const { editState } = this.editingState[consultationId];
    const updates = [];
    if (isStatusChanged) {
      updates.push(this.supportService.updateConsultationStatus(consultationId, { status: editState.status }));
    }
    if (isResponseChannelChanged) {
      updates.push(this.supportService.updateConsultationResponseChannel(consultationId, { response_channel: editState.response_channel }));
    }

    if (updates.length > 0) {
      forkJoin(updates).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.loadData();
          this.editingState[consultationId].isEditing = false;
          this.toastService.showToast('Cambios guardados exitosamente', 'success');
        },
        error: (error) => {
          this.toastService.showToast('Error al guardar cambios: ' + error.message, 'error');
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

  openConfirmModal(title: string, message: string, modalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default', action: () => void): void {
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmModalType = modalType;
    this.confirmModalText = 'Confirmar';
    this.cancelModalText = 'Cancelar';
    this.confirmAction = action;
    if (this.confirmModal) {
      this.confirmModal.title = title;
      this.confirmModal.modalType = modalType;
      this.confirmModal.isConfirmModal = true;
      this.confirmModal.confirmText = 'Confirmar';
      this.confirmModal.cancelText = 'Cancelar';
      this.confirmModal.open();
    }
  }

  handleConfirm(): void {
    if (this.confirmAction) {
      this.confirmAction();
      this.confirmAction = null;
    }
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
    const statusMap: { [key: string]: string } = {
      pending: 'Pendiente',
      in_progress: 'En Proceso',
      resolved: 'Resuelto',
      closed: 'Cerrado'
    };
    return statusMap[status] || status;
  }

  // Filter Methods
  updateActiveFilters(filters: any): void {
    this.activeFilters = Object.keys(filters)
      .filter((key) => filters[key])
      .map((key) => ({
        key,
        value: this.getFilterDisplayValue(key, filters[key])
      }));
  }

  getFilterDisplayValue(key: string, value: string): string {
    switch (key) {
      case 'status':
        return `Estado: ${this.getStatusText(value)}`;
      case 'contact_channel':
        return `Canal de Contacto: ${value}`;
      case 'response_channel':
        return `Canal de Respuesta: ${value}`;
      case 'user_id':
        return value === 'registered' ? 'Usuarios Registrados' : 'Usuarios No Registrados';
      case 'startDate':
        return `Desde: ${value}`;
      case 'endDate':
        return `Hasta: ${value}`;
      default:
        return value;
    }
  }

  resetFilters(): void {
    this.filtersForm.reset();
    localStorage.removeItem('supportFilters');
  }

  removeFilter(key: string): void {
    this.filtersForm.get(key)?.setValue('');
  }
}