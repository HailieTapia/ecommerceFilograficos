import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalComponent } from '../../../modal/modal.component';
import { TypeService } from '../../services/type.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-email-type',
  imports: [ModalComponent, ReactiveFormsModule, CommonModule],
  standalone: true,
  templateUrl: './email-type.component.html',
  styleUrls: ['./email-type.component.css'],
})

export class EmailTypeComponent implements OnInit {
  emailTypeForm: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';
  emailTypeId: number | null = null;
  emailTypes: any[] = [];
  selectedEmailType: any = null;

  constructor(private typeService: TypeService, private fb: FormBuilder) {
    this.emailTypeForm = this.fb.group({
      token: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      required_variables: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.getAllEmailTypes();
  }
  // Obtener todos los tipos activos
  getAllEmailTypes(): void {
    this.typeService.getAllEmailTypes().subscribe({
      next: (data) => {
        this.emailTypes = data.emailTypes;
      },
      error: (err) => {
        console.error('Error al obtener los tipos de correo electrónico:', err);
      }
    });
  }
  // Eliminación lógica
  deleteEmailType(id: number): void {
    if (confirm('¿Está seguro de eliminar este tipo de correo electrónico?')) {
      this.typeService.deleteEmailType(id).subscribe({
        next: (response) => {
          this.successMessage = response.message || 'Tipo de correo electrónico eliminado exitosamente.';
          this.getAllEmailTypes();
        },
        error: (error) => {
          this.errorMessage = 'Error al eliminar el tipo de correo electrónico: ' + error.message;
          console.error("Error en la llamada API:", error);
        }
      });
    }
  }
  //Obtener tipo por ID
  getEmailTypeById(id: number): void {
    this.typeService.getEmailTypeById(id).subscribe({
      next: (data) => {
        this.selectedEmailType = data.emailType;
        console.log('Tipo de correo electrónico seleccionado:', this.selectedEmailType);
      },
      error: (err) => {
        console.error('Error al obtener el tipo de correo electrónico por ID:', err);
      }
    });
  }
  submitEmailType() {
    if (this.emailTypeForm.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos requeridos.';
      return;
    }

    const formData = { ...this.emailTypeForm.value };
    formData.required_variables = formData.required_variables
      .split(',')
      .map((item: string) => item.trim());

    if (this.emailTypeId) {
      this.updateEmailType(this.emailTypeId, formData);
    } else {
      this.createEmailType(formData);
    }
  }
  // Crear tipo de email
  private createEmailType(data: any) {
    this.typeService.createEmailType(data).subscribe(
      response => {
        this.successMessage = 'Tipo de correo electrónico creado exitosamente.';
        this.modal.close();
        this.getAllEmailTypes();
      },
      error => {
        this.errorMessage = 'Error al crear el tipo de correo electrónico: ' + error.message;
      }
    );
  }
  // Actualizar tipo de email
  private updateEmailType(id: number, data: any) {
    this.typeService.updateEmailType(id, data).subscribe(
      response => {
        this.successMessage = 'Tipo de correo electrónico actualizado exitosamente.';
        this.modal.close();
        this.getAllEmailTypes();
      },
      error => {
        this.errorMessage = 'Error al actualizar el tipo de correo electrónico: ' + error.message;
      }
    );
  }

  //MODAL
  @ViewChild('modal') modal!: ModalComponent;
  openModal(emailType?: any) {
    this.emailTypeForm.reset();
    this.successMessage = '';
    this.errorMessage = '';

    if (emailType) {
      this.emailTypeId = emailType.email_type_id;
      this.emailTypeForm.patchValue({
        token: emailType.token,
        name: emailType.name,
        description: emailType.description,
        required_variables: emailType.required_variables?.join(', ') || ''
      });
    } else {
      this.emailTypeId = null;
    }

    this.modal.open();
  }
}
