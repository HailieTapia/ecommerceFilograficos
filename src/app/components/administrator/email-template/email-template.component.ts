import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalComponent } from '../../../modal/modal.component';
import { TemplateService } from '../../services/template.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

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
  constructor(private templateService: TemplateService, private fb: FormBuilder) {
    // Definir validaciones para cada campo
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
        console.log('Tipo de correo electrónico seleccionado:', this.selectedEmailTemplate);
      },
      error: (err) => {
        console.error('Error al obtener el tipo de correo electrónico por ID:', err);
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
          this.errorMessage = 'Error al eliminar el tipo de correo electrónico: ' + error.message;
          console.error("Error en la llamada API:", error);
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
        console.error('Error al obtener los tipos de correo electrónico:', err);
      }
    });
  }

  // Método para manejar el envío del formulario
  crearPlantilla() {
    if (this.emailTemplateForm.valid) {
      const formData = this.emailTemplateForm.value;
      formData.variables = formData.variables.split(',').map((variable: string) => variable.trim());
      this.templateService.createEmailTemplate(formData).subscribe(
        response => {
          console.log('Plantilla creada con éxito:', response);
        },
        error => {
          console.error('Error al crear plantilla:', error);
        }
      );
    } else {
      console.log('Formulario no válido');
    }
  }
  actualizarPlantilla(id: number, data: any): void {
    this.templateService.updateEmailTemplate(id, data).subscribe(
      response => {
        console.log('Plantilla actualizada con éxito:', response);
        this.modal.close();
        this.getAllTemplates();
      },
      error => {
        console.error('Error al actualizar plantilla:', error);
      }
    );
  }
  //MODAL
  @ViewChild('modal') modal!: ModalComponent;
  openModal(emailType?: any) {

    this.modal.open();
  }
}