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
  emailTypes: any[] = [];
  emailTypeForm: FormGroup;
  selectedEmailType: any = null;

  constructor(private typeService: TypeService, private fb: FormBuilder) {
    this.emailTypeForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      token: ['', Validators.required]
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

  // Crear tipo de email (NO)
  addEmailType(): void {
    if (this.emailTypeForm.valid) {
      this.typeService.createEmailType(this.emailTypeForm.value).subscribe({
        next: (response) => {
          console.log('Tipo de correo electrónico creado:', response);
          this.loadEmailTypes();
          this.emailTypeForm.reset();
        },
        error: (err) => {
          console.error('Error al crear el tipo de correo electrónico:', err);
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
  // Eliminación lógica(NO)
  deleteEmailType(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este tipo de email?')) {
      this.typeService.deleteEmailType(id).subscribe({
        next: () => {
          alert('Tipo de email eliminado correctamente.');
          this.loadEmailTypes();
        },
        error: (err) => {
          console.error('Error al eliminar el tipo de correo electrónico:', err);
          alert('Error al eliminar el tipo de email.');
        }
      });
    }
  }
}
