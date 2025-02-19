import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SupportInquiryService } from '../../services/support-inquiry.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-support-panel',
  templateUrl: './support-panel.component.html',
  styleUrls: ['./support-panel.component.css'],
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule]
})
export class SupportPanelComponent implements OnInit {
  consultationCounts: any = {};
  consultations: any[] = [];
  editingStates: { [key: string]: { 
    isEditing: boolean; 
    status: string; 
    response_channel: string 
  }} = {};
  errorMessage: string = '';

  constructor(private supportService: SupportInquiryService) { }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.supportService.getConsultationCountsByStatus().subscribe({
      next: (response) => {
        this.consultationCounts = response.consultationCounts.reduce((acc: any, curr: any) => {
          acc[curr.status] = curr.count;
          return acc;
        }, {});
      },
      error: (error) => console.error('Error loading counts:', error)
    });

    this.supportService.getAllConsultations().subscribe({
      next: (response) => {
        this.consultations = response.consultations;
        console.log(this.consultations)
        this.initializeEditingStates();
      },
      error: (error) => console.error('Error loading consultations:', error)
    });
  }

  private initializeEditingStates(): void {
    this.editingStates = {};
    this.consultations.forEach(consultation => {
      this.editingStates[consultation.inquiry_id] = {
        isEditing: false,
        status: consultation.status,
        response_channel: consultation.response_channel
      };
    });
  }

  handleEdit(consultationId: string): void {
    this.editingStates[consultationId].isEditing = true;
  }

  handleSave(consultationId: string): void {
    const editingState = this.editingStates[consultationId];
    const consultation = this.consultations.find(c => c.inquiry_id === consultationId);
  
    // Validar el flujo de estados
    if (consultation.status !== editingState.status && 
        !this.isValidStatusTransition(consultation.status, editingState.status)) {
      this.errorMessage = 'No se puede cambiar el estado a uno anterior. El flujo de estados debe ser: Pendiente → En Proceso → Resuelto → Cerrado.';
      return;
    }
  
    // Mostrar confirmación antes de actualizar el estado
    const confirmMessage = `¿Estás seguro de cambiar el estado de "${this.getStatusText(consultation.status)}" a "${this.getStatusText(editingState.status)}"? Esta acción es irreversible.`;
    if (!confirm(confirmMessage)) {
      return;
    }
  
    const updates = [];
  
    // Actualizar el estado si ha cambiado
    if (consultation.status !== editingState.status) {
      updates.push(this.supportService.updateConsultationStatus(
        consultationId, 
        { status: editingState.status }
      ));
    }
  
    // Actualizar el canal de respuesta si ha cambiado
    if (consultation.response_channel !== editingState.response_channel) {
      updates.push(this.supportService.updateConsultationResponseChannel(
        consultationId, 
        { response_channel: editingState.response_channel }
      ));
    }
  
    // Ejecutar las actualizaciones
    if (updates.length > 0) {
      forkJoin(updates).subscribe({
        next: () => {
          this.loadData(); // Recargar los datos
          this.editingStates[consultationId].isEditing = false; // Salir del modo edición
          this.errorMessage = ''; // Limpiar el mensaje de error
        },
        error: (error) => {
          console.error('Error saving changes:', error);
          this.editingStates[consultationId].isEditing = false;
          this.errorMessage = 'Ocurrió un error al guardar los cambios. Por favor, inténtalo de nuevo.';
        }
      });
    } else {
      this.editingStates[consultationId].isEditing = false;
    }
  }

  handleCancel(consultationId: string): void {
    const originalData = this.consultations.find(c => c.inquiry_id === consultationId);
    this.editingStates[consultationId] = {
      isEditing: false,
      status: originalData.status,
      response_channel: originalData.response_channel
    };
  }

  getResponseChannelIcon(channel: string): string {
    const icons: { [key: string]: string } = {
      email: 'fas fa-envelope',
      whatsapp: 'fab fa-whatsapp',
      phone: 'fas fa-phone'
    };
    return icons[channel] || 'fas fa-question-circle';
  }

  // Función para validar el flujo de estados
  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: { [key: string]: string[] } = {
      pending: ['in_progress', 'resolved', 'closed'], // Puede avanzar a cualquier estado
      in_progress: ['resolved', 'closed'], // No puede volver a 'pending'
      resolved: ['closed'], // No puede volver a 'pending' o 'in_progress'
      closed: [] // No puede cambiar de estado
    };

    return validTransitions[currentStatus].includes(newStatus);
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'in_progress': 'En Proceso',
      'resolved': 'Resuelto',
      'closed': 'Cerrado'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'resolved': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return `${classes[status]} px-2 py-1 rounded-full text-sm`;
  }

  isRegisteredUser(consultation: any): boolean {
    return !!consultation.user_id;
  }
}