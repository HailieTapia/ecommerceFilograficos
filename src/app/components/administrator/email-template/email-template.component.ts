import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ModalComponent } from '../../../modal/modal.component';
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
  @ViewChild('modal') modal!: ModalComponent;
  @ViewChild('viewModal') viewModal!: ModalComponent;
  emailTemplateForm: FormGroup;
  emailTemplates: any[] = [];
  emailTemplateId: number | null = null;
  selectedEmailTemplate: any = null;

  constructor(private toastService: ToastService, private templateService: TemplateService, private fb: FormBuilder) {
    this.emailTemplateForm = this.fb.group({
      name: ['', [Validators.required]],
      email_type_id: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      subject: ['', [Validators.required]],
      html_content: ['', [Validators.required]],
      text_content: ['', [Validators.required]],
      variables: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.getAllTemplates();
  }

  ngAfterViewInit(): void {
    if (!this.modal || !this.viewModal) {
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
        this.viewModal.open();
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
          this.emailTemplateForm.patchValue(template);
          this.modal.open();
        } else {
          this.toastService.showToast('La plantilla no está disponible para edición.', 'info');
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
    this.modal.open();
  }

  saveTemplate(): void {
    if (!this.emailTemplateForm.valid) {
      this.emailTemplateForm.markAllAsTouched();
      this.toastService.showToast('Por favor, completa todos los campos requeridos correctamente.', 'error');
      return;
    }

    const templateData = this.emailTemplateForm.value;
    if (this.emailTemplateId) {
      this.templateService.updateEmailTemplate(this.emailTemplateId, templateData).subscribe({
        next: () => {
          this.toastService.showToast('Plantilla actualizada exitosamente', 'success');
          this.getAllTemplates();
          this.modal.close();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al actualizar la plantilla';
          this.toastService.showToast(errorMessage, 'error');
        }
      });
    } else {
      this.templateService.createEmailTemplate(templateData).subscribe({
        next: () => {
          this.toastService.showToast('Plantilla creada exitosamente', 'success');
          this.getAllTemplates();
          this.modal.close();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al crear la plantilla';
          this.toastService.showToast(errorMessage, 'error');
        }
      });
    }
  }

  deleteEmailTemplate(id: number): void {
    this.toastService.showToast(
      '¿Estás seguro de que deseas eliminar esta plantilla? Esta acción no se puede deshacer.',
      'warning',
      'Confirmar',
      () => {
        this.templateService.deleteEmailTemplate(id).subscribe({
          next: (response) => {
            this.toastService.showToast(response.message || 'Plantilla eliminada exitosamente', 'success');
            this.getAllTemplates();
          },
          error: (error) => {
            const errorMessage = error?.error?.message || 'Error al eliminar la plantilla de correo electrónico';
            this.toastService.showToast(errorMessage, 'error');
          }
        });
      }
    );
  }
}