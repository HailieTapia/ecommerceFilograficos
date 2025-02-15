import { Component, OnInit } from '@angular/core';
import { TypeService } from '../../services/type.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-email-type',
  imports: [ReactiveFormsModule, CommonModule],
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

  constructor(private typeService: TypeService, private fb: FormBuilder) {
    this.emailTypeForm = this.fb.group({
      token: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      required_variables: ['', [Validators.required]]
    });
  }
  
  ngOnInit(): void {
    this.loadEmailTypes();
  }

  // Obtener todos los tipos activos
  loadEmailTypes(): void {
    this.typeService.getAllEmailTypes().subscribe({
      next: (data) => {
        this.emailTypes = data.emailTypes;
      },
      error: (err) => {
        console.error('Error al obtener los tipos de correo electrónico:', err);
      }
    });
  }

  onSubmit() {
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
  // Método para actualizar el tipo de correo electrónico
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
}
