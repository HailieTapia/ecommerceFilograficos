import { Component, OnInit } from '@angular/core';
import { RegulatoryService } from '../../services/regulatory.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-regulatory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './regulatory.component.html',
  styleUrl: './regulatory.component.css'
})
export class RegulatoryComponent {
  documentForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private regulatoryService: RegulatoryService,

  ) {
    this.documentForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      effective_date: ['']
    });
  }

  submitForm(): void {
    if (this.documentForm.invalid) {
      console.log('Por favor, complete todos los campos requeridos.');
      return;
    }

    this.isSubmitting = true;
    const formData = this.documentForm.value;

    this.regulatoryService.createRegulatoryDocument(formData).subscribe({
      next: (response) => {
        console.log('Documento creado exitosamente.');
        this.documentForm.reset(); // Reinicia el formulario tras éxito
      },
      error: (error) => {
        console.error('Error al crear documento:', error);
        // Mostrar detalles completos del error para depurar
        if (error.error) {
          console.error('Detalles del error:', error.error);
        }
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }
}