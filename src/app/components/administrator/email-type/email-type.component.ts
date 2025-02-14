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

  // Cargar todos los tipos de email
  loadEmailTypes(): void {
    this.typeService.getAllEmailTypes().subscribe({
      next: (data) => {
        this.emailTypes = data.emailTypes;
      },
      error: (err) => {
        console.error('Error fetching email types:', err);
      }
    });
  }

  // Agregar un nuevo tipo de email
  addEmailType(): void {
    if (this.emailTypeForm.valid) {
      this.typeService.createEmailType(this.emailTypeForm.value).subscribe({
        next: (response) => {
          console.log('Email Type Created:', response);
          this.loadEmailTypes(); // Recargar la lista
          this.emailTypeForm.reset(); // Limpiar el formulario
        },
        error: (err) => {
          console.error('Error creating email type:', err);
        }
      });
    }
  }
  //agregar
  getEmailTypeById(id: number): void {
    this.typeService.getEmailTypeById(id).subscribe({
      next: (data) => {
        this.selectedEmailType = data.emailType;
        console.log('Selected Email Type:', this.selectedEmailType);
      },
      error: (err) => {
        console.error('Error fetching email type by ID:', err);
      }
    });
  }
  //eliminar 
  deleteEmailType(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este tipo de email?')) {
      this.typeService.deleteEmailType(id).subscribe({
        next: () => {
          alert('Tipo de email eliminado correctamente.');
          this.loadEmailTypes(); // Recargar lista
        },
        error: (err) => {
          console.error('Error deleting email type:', err);
          alert('Error al eliminar el tipo de email.');
        }
      });
    }
  }
}
