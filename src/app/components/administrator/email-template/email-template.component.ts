import { Component, OnInit, ViewChild } from '@angular/core';
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
export class EmailTemplateComponent {
  emailTemplateForm: FormGroup;
  emailTemplate: any[] = [];
  successMessage: string = '';
  errorMessage: string = '';
  selectedEmailTemplate: any = null;
  emailTemplateId: number | null = null;

  constructor(    private toastService: ToastService,private templateService: TemplateService, private fb: FormBuilder) {
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

  //Obtener tipo por ID
  getEmailTemplateById(id: number): void {
    this.templateService.getEmailTemplateById(id).subscribe({
      next: (data) => {
        this.selectedEmailTemplate = data;
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener el tipo de correo electrónico';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  // Eliminación lógica
  deleteEmailTemplate(id: number): void {
    if (confirm('¿Está seguro de eliminar este tipo de correo electrónico?')) {
      this.templateService.deleteEmailTemplate(id).subscribe({
        next: (response) => {
          this.successMessage = response.message || 'Tipo de correo electrónico eliminado exitosamente.';
          this.getAllTemplates();
        },
        error: (error) => {
          const errorMessage = error?.error?.message || 'Error al eliminar el tipo de correo electrónico';
          this.toastService.showToast(errorMessage, 'error');
        }
      });
    }
  }
  // Obtener todos los tipos activos
  getAllTemplates(): void {
    this.templateService.getAllTemplates().subscribe({
      next: (data) => {
        console.log(data);
        this.emailTemplate = data;
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener los tipo de correo electrónico';
          this.toastService.showToast(errorMessage, 'error');
        console.error('Error al obtener los tipos de correo electrónico:', err);
      }
    });
  }
  submitEmailTemplate() {
    if (this.emailTemplateForm.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos requeridos.';
      return;
    }

    const formData = { ...this.emailTemplateForm.value };
    formData.variables = formData.variables
      .split(',')
      .map((item: string) => item.trim());

    if (this.emailTemplateId) {
      this.actualizarPlantilla(this.emailTemplateId, formData);
    } else {
      this.crearPlantilla(formData);
    }
  }

  // Método para manejar el envío del formulario
  private crearPlantilla(data: any) {
    this.templateService.createEmailTemplate(data).subscribe(
      response => {
        this.toastService.showToast('Plantilla de correo electrónico creado exitosamente.', 'success');
        this.modal.close();
        this.getAllTemplates();
      },
      error => {
        this.errorMessage = 'Error al crear la plantilla de correo electrónico: ' + error.message;
      }
    );
  }
  private actualizarPlantilla(id: number, data: any): void {
    this.templateService.updateEmailTemplate(id, data).subscribe(
      response => {
        this.toastService.showToast('Plantilla de correo electrónico actualizado exitosamente.', 'success');
        this.modal.close();
        this.getAllTemplates();
      },
      error => {
        this.errorMessage = 'Error al actualizar la plantilla de correo electrónico: ' + error.message;
      }
    );
  }
  //MODAL
  @ViewChild('modal') modal!: ModalComponent;
  openModal(emailTemplate?: any) {
    this.emailTemplateForm.reset();
    this.successMessage = '';
    this.errorMessage = '';

    if (emailTemplate) {
      this.emailTemplateId = emailTemplate.email_type_id;
      this.emailTemplateForm.patchValue({
        name: emailTemplate.name,
        email_type_id: emailTemplate.email_type_id,
        subject: emailTemplate.subject,
        html_content: emailTemplate.html_content,
        text_content: emailTemplate.text_content,
        variables: emailTemplate.variables?.join(', ') || ''
      });
    } else {
      this.emailTemplateId = null;
    }

    this.modal.open();
  }
}