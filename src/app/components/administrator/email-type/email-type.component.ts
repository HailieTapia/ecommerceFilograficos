import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalComponent } from '../../../modal/modal.component';
import { TypeService } from '../../services/type.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-email-type',
  imports: [ModalComponent, ReactiveFormsModule, CommonModule, FormsModule],
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
  variablesList: string[] = [];
  variableControl: FormControl = new FormControl(''); // Control para el input de variables

  constructor(private typeService: TypeService, private fb: FormBuilder) {
    this.emailTypeForm = this.fb.group({
      token: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      required_variables: [[], [
        Validators.required,
        (control: AbstractControl) => {
          return control.value && control.value.length > 0 ? null : { required: true };
        }
      ]]
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

  // Obtener tipo por ID
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
    // Actualiza required_variables con la lista actual
    this.emailTypeForm.patchValue({
      required_variables: this.variablesList
    });

    if (this.emailTypeForm.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos requeridos.';
      return;
    }

    console.log("Formulario válido, procediendo a enviar...");

    // Actualizar el valor de required_variables en el formulario
    this.emailTypeForm.patchValue({
      required_variables: this.variablesList // Enviar como arreglo de strings
    });

    const formData = { ...this.emailTypeForm.value };
    console.log("Datos del formulario:", formData);

    if (this.emailTypeId) {
      console.log("Actualizando tipo de correo...");
      this.updateEmailType(this.emailTypeId, formData);
    } else {
      console.log("Creando nuevo tipo de correo...");
      this.createEmailType(formData);
    }
  }

  // Crear tipo de email
  private createEmailType(data: any) {
    console.log("Enviando datos al backend para crear:", data);
    this.typeService.createEmailType(data).subscribe(
      response => {
        console.log("Respuesta del backend:", response);
        this.successMessage = 'Tipo de correo electrónico creado exitosamente.';
        this.modal.close();
        this.getAllEmailTypes();
      },
      error => {
        console.error("Error al crear el tipo de correo electrónico:", error);
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

  // Agregar variable
  addVariable() {
    const variable = this.variableControl.value.trim();
    if (variable) {
      this.variablesList.push(variable);
      this.variableControl.reset();
      // Actualizar el FormControl required_variables
      this.emailTypeForm.patchValue({
        required_variables: this.variablesList
      });
      // Forzar validación inmediata
      this.emailTypeForm.controls['required_variables'].updateValueAndValidity();
    }
  }
  
  //Eliminar variable
  removeVariable(variable: string) {
    this.variablesList = this.variablesList.filter(v => v !== variable);
    // Actualizar el FormControl required_variables
    this.emailTypeForm.patchValue({
      required_variables: this.variablesList
    });
    // Forzar validación inmediata
    this.emailTypeForm.controls['required_variables'].updateValueAndValidity();
  }

  // MODAL
  @ViewChild('modal') modal!: ModalComponent;
  openModal(emailType?: any) {
    console.log("Abriendo modal...");
    this.emailTypeForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
    this.variablesList = [];
    this.variableControl.reset(); // Limpiar el control del input

    if (emailType) {
      this.emailTypeId = emailType.email_type_id;
      this.variablesList = emailType.required_variables || [];
      this.emailTypeForm.patchValue({
        token: emailType.token,
        name: emailType.name,
        description: emailType.description,
        required_variables: this.variablesList // Asignar la lista actualizada
      });
    } else {
      this.emailTypeId = null;
    }

    this.modal.open();
  }
}