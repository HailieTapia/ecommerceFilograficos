import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ModalComponent } from '../../../modal/modal.component';
import { TemplateService } from '../../services/template.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../services/toastService';
import { DataSource } from '@angular/cdk/collections';

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
  emailTemplate: any[] = [];
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

  // Mostrar detalles en el modal sin edición
  openViewModal(templateId: number): void {
    this.templateService.getEmailTemplateById(templateId).subscribe({
      next: (data) => {
        this.selectedEmailTemplate = data;
        this.viewModal.open();
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener los detalles';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  // Eliminación lógica
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
            const errorMessage = error?.error?.message || 'Error al eliminar el tipo de correo electrónico';
            this.toastService.showToast(errorMessage, 'error');
          }
        });
      }
    );
  }

  // MODAL
  ngAfterViewInit(): void {
    if (!this.modal) {
      this.toastService.showToast('El modal no está inicializado correctamente.', 'info');
    }
  }
  // MODAL
  openCreateModal(): void {
    this.emailTemplateId = null;
    this.emailTemplateForm.reset();
    this.modal.open();
  }
  // MODAL
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
  //crear-actualizar
  saveTemplate(): void {
    if (!this.emailTemplateForm.valid) {
      this.toastService.showToast('Por favor, completa todos los campos requeridos.', 'error');
      return;
    }
    const categoryData = this.emailTemplateForm.value;
    if (this.emailTemplateId) {
      this.templateService.updateEmailTemplate(this.emailTemplateId, categoryData).subscribe({
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
      this.templateService.createEmailTemplate(categoryData).subscribe({
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
  // Obtener todos los tipos activos
  getAllTemplates(): void {
    this.templateService.getAllTemplates().subscribe({
      next: (data) => {
        this.emailTemplate = data;
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener los tipo de correo electrónico';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }
}