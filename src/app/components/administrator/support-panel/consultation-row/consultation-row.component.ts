import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportInquiryService } from '../../../../services/support-inquiry.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-consultation-row',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultation-row.component.html',
})
export class ConsultationRowComponent {
  @Input() consultation!: any;
  @Output() saved = new EventEmitter<void>();
  
  isEditing = false;
  errorMessage = '';
  editState = {
    status: '',
    response_channel: ''
  };

  constructor(public service: SupportInquiryService) {}

  handleEdit(): void {
    this.editState = {
      status: this.consultation.status,
      response_channel: this.consultation.response_channel
    };
    this.isEditing = true;
  }

  handleSave(): void {
    const isStatusChanged = this.consultation.status !== this.editState.status;
    const isResponseChannelChanged = this.consultation.response_channel !== this.editState.response_channel;
  
    // Si solo cambia el canal de respuesta, se permite sin validaciones
    if (isStatusChanged && !this.service.isValidStatusTransition(this.consultation.status, this.editState.status)) {
      this.errorMessage = 'No se puede cambiar el estado a uno anterior...';
      setTimeout(() => {
        this.errorMessage = ''; // Limpiar el error después de 3 segundos
        this.resetComponent(); // Limpiar el estado del componente
      }, 3000);
      return;
    }
  
    // Mostrar confirmación solo si el estado cambió
    if (isStatusChanged && !confirm(this.getConfirmationMessage())) return;
  
    const updates = [];
  
    // Si el estado cambió y es una transición válida, se actualiza
    if (isStatusChanged) {
      updates.push(this.service.updateConsultationStatus(
        this.consultation.inquiry_id, 
        { status: this.editState.status }
      ));
    }
  
    // Si el canal de respuesta cambió, se actualiza sin importar el estado
    if (isResponseChannelChanged) {
      updates.push(this.service.updateConsultationResponseChannel(
        this.consultation.inquiry_id, 
        { response_channel: this.editState.response_channel }
      ));
    }
  
    // Si hay actualizaciones pendientes, las ejecutamos
    if (updates.length > 0) {
      forkJoin(updates).subscribe({
        next: () => {
          this.saved.emit();
          this.isEditing = false;
        },
        error: (error) => {
          console.error('Error saving changes:', error);
          this.errorMessage = 'Error al guardar cambios...';
        }
      });
    } else {
      // Si no hay actualizaciones, cerramos la edición y volvemos al modo vista
      this.isEditing = false;
    }
  }

  private getConfirmationMessage(): string {
    return `¿Estás seguro de cambiar el estado de "${this.service.getStatusText(this.consultation.status)}" a "${this.service.getStatusText(this.editState.status)}"? Esta acción es irreversible.`;
  }

  private resetComponent(): void {
    // Limpiar el estado de edición y el error
    this.editState = {
      status: this.consultation.status,
      response_channel: this.consultation.response_channel
    };
    this.isEditing = false;
  }

  getResponseChannelIcon(channel: string): string {
    const icons: { [key: string]: string } = {
      email: 'fas fa-envelope',
      whatsapp: 'fab fa-whatsapp',
      phone: 'fas fa-phone'
    };
    return icons[channel] || 'fas fa-question-circle';
  }

  isRegisteredUser(): boolean {
    return !!this.consultation.user_id;
  }
}
