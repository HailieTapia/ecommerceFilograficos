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
        console.error(data);
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
  // Crear tipo de email
  createEmailType() {
    if (this.emailTypeForm.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos requeridos.';
      return;
    }

    const formData = this.emailTypeForm.value;
    console.log("Datos antes de enviar:", formData);

    if (typeof formData.required_variables === 'string') {
      formData.required_variables = formData.required_variables
        .split(',')
        .map((item: string) => item.trim());
      console.log("required_variables como array:", formData.required_variables);
    }

    this.typeService.createEmailType(formData).subscribe(
      response => {
        this.successMessage = 'Tipo de correo electrónico creado exitosamente.';
        this.emailTypeForm.reset();
      },
      error => {
        this.errorMessage = 'Error al crear el tipo de correo electrónico: ' + error.message;
        console.error("Error en la llamada API:", error);
      }
    );
  }
  // Actualizar tipo de email
  updateEmailType(id: number, data: any): void {
    this.typeService.updateEmailType(id, data).subscribe(
      response => {
        this.successMessage = 'Tipo de correo electrónico actualizado exitosamente.';
        this.emailTypeForm.reset();
      },
      error => {
        this.errorMessage = 'Error al actualizar el tipo de correo electrónico: ' + error.message;
        console.error("Error en la llamada API:", error);
      }
    );
  }
  //MODAL
  @ViewChild('modal') modal!: ModalComponent;
  openModal() {
    this.modal.open();
  }
}
