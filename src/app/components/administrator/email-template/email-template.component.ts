import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ModalComponent } from '../../reusable/modal/modal.component';
import { TemplateService } from '../../services/template.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../services/toastService';

@Component({
  selector: 'app-email-template',
  standalone: true,
  imports: [ModalComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './email-template.component.html',
  styleUrls: ['./email-template.component.css']
})
export class EmailTemplateComponent implements OnInit, AfterViewInit {
  @ViewChild('createEditModal') createEditModal!: ModalComponent;
  @ViewChild('viewDetailsModal') viewDetailsModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

  emailTemplateForm: FormGroup;
  emailTemplates: any[] = [];
  emailTemplateId: number | null = null;
  selectedEmailTemplate: any = null;
  confirmAction: (() => void) | null = null;
  confirmModalTitle: string = '';
  confirmModalMessage: string = '';
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';

  constructor(private toastService: ToastService, private templateService: TemplateService, private fb: FormBuilder) {
    this.emailTemplateForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email_type_id: ['', [Validators.required, Validators.pattern('^[1-9][0-9]*$')]], // Positive integer
      subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      html_content: ['', [Validators.required]],
      text_content: ['', [Validators.required]],
      variables: ['', [Validators.required, Validators.pattern(/^\[.*\]$/)]]
    });
  }

  ngOnInit(): void {
    this.getAllTemplates();
  }

  ngAfterViewInit(): void {
    if (!this.createEditModal || !this.viewDetailsModal || !this.confirmModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }

  getAllTemplates(): void {
    this.templateService.getAllTemplates().subscribe({
      next: (data) => {
        this.emailTemplates = data;
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener las plantillas de correo electrónico';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  openViewModal(templateId: number): void {
    this.templateService.getEmailTemplateById(templateId).subscribe({
      next: (data) => {
        this.selectedEmailTemplate = data;
        if (this.viewDetailsModal) {
          this.viewDetailsModal.modalType = 'default';
          this.viewDetailsModal.title = 'Detalles de la Plantilla';
          this.viewDetailsModal.open();
        }
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener los detalles de la plantilla';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  openEditModal(templateId: number): void {
    this.emailTemplateId = templateId;
    this.templateService.getEmailTemplateById(templateId).subscribe({
      next: (template) => {
        if (template?.active) {
          this.emailTemplateForm.patchValue({
            name: template.name,
            email_type_id: template.email_type_id,
            subject: template.subject,
            html_content: template.html_content,
            text_content: template.text_content,
            variables: JSON.stringify(template.variables)
          });
          if (this.createEditModal) {
            this.createEditModal.modalType = 'info';
            this.createEditModal.title = 'Editar Plantilla';
            this.createEditModal.open();
          }
        } else {
          this.toastService.showToast('La plantilla no está disponible para edición.', 'error');
        }
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener la plantilla';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  openCreateModal(): void {
    this.emailTemplateId = null;
    this.emailTemplateForm.reset();
    if (this.createEditModal) {
      this.createEditModal.modalType = 'success';
      this.createEditModal.title = 'Crear Plantilla';
      this.createEditModal.open();
    }
  }

  openConfirmModal(title: string, message: string, modalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default', action: () => void) {
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmModalType = modalType;
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

  saveTemplate(): void {
    if (this.emailTemplateForm.invalid) {
      this.emailTemplateForm.markAllAsTouched();
      this.toastService.showToast('Formulario inválido. Revisa los campos.', 'error');
      return;
    }

    const templateData = {
      ...this.emailTemplateForm.value,
      variables: JSON.parse(this.emailTemplateForm.value.variables)
    };

    const saveAction = this.emailTemplateId
      ? this.templateService.updateEmailTemplate(this.emailTemplateId, templateData)
      : this.templateService.createEmailTemplate(templateData);

    saveAction.subscribe({
      next: () => {
        this.toastService.showToast(
          this.emailTemplateId ? 'Plantilla actualizada exitosamente' : 'Plantilla creada exitosamente',
          'success'
        );
        this.getAllTemplates();
        if (this.createEditModal) this.createEditModal.close();
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al guardar la plantilla';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  deleteEmailTemplate(id: number): void {
    const template = this.emailTemplates.find(t => t.template_id === id);
    if (!template) {
      this.toastService.showToast('Plantilla no encontrada.', 'error');
      return;
    }
    this.openConfirmModal(
      'Eliminar Plantilla',
      `¿Estás seguro de que deseas eliminar la plantilla "${template.name}"? Esta acción no se puede deshacer.`,
      'danger',
      () => {
        this.templateService.deleteEmailTemplate(id).subscribe({
          next: (response) => {
            this.toastService.showToast(response.message || 'Plantilla eliminada exitosamente', 'success');
            this.getAllTemplates();
            if (this.confirmModal) this.confirmModal.close();
          },
          error: (err) => {
            const errorMessage = err?.error?.message || 'Error al eliminar la plantilla';
            this.toastService.showToast(errorMessage, 'error');
            if (this.confirmModal) this.confirmModal.close();
          }
        });
      }
    );
  }
}