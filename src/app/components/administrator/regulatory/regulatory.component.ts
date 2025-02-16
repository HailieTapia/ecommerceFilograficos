import { Component, OnInit, ViewChild } from '@angular/core';
import { RegulatoryService } from '../../services/regulatory.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../modal/modal.component';

@Component({
  selector: 'app-regulatory',
  standalone: true,
  imports: [ModalComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './regulatory.component.html',
  styleUrl: './regulatory.component.css'
})
export class RegulatoryComponent implements OnInit {
  documentForm: FormGroup;
  documents: any[] = [];
  documentId: number | null = null;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private regulatoryService: RegulatoryService
  ) {
    this.documentForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      effective_date: ['']
    });
  }

  ngOnInit(): void {
    this.getAllCurrentVersions();
  }

  // Obtener todas las versiones vigentes
  getAllCurrentVersions(): void {
    this.regulatoryService.getAllCurrentVersions().subscribe(
      (response) => {
        console.log('Obtención con éxito:', response);
        this.documents = response;
      },
      (error) => {
        console.error('Error al obtener:', error);
      }
    );
  }

  // Guardar documento (Crear o Actualizar)
  saveRegulatoryDocument(): void {
    if (this.documentForm.invalid) {
      console.log('Por favor, complete todos los campos requeridos.');
      return;
    }

    const formData = this.documentForm.value;

    if (this.documentId) {
      // Actualizar documento existente
      this.regulatoryService.updateRegulatoryDocument(this.documentId, formData).subscribe({
        next: () => {
          console.log('Documento actualizado exitosamente.');
          this.getAllCurrentVersions();
          this.modal.close();
        },
        error: (error) => {
          console.error('Error al actualizar documento:', error);
        }
      });
    } else {
      // Crear nuevo documento
      this.regulatoryService.createRegulatoryDocument(formData).subscribe({
        next: () => {
          console.log('Documento creado exitosamente.');
          this.getAllCurrentVersions();
          this.documentForm.reset();
          this.modal.close();
        },
        error: (error) => {
          console.error('Error al crear documento:', error);
        }
      });
    }
  }


  // Eliminar documento (lógico)
  deleteRegulatoryDocument(documentId: number): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      return;
    }

    this.regulatoryService.deleteRegulatoryDocument(documentId).subscribe({
      next: () => {
        console.log('Documento eliminado exitosamente.');
        this.documents = this.documents.filter(doc => doc.id !== documentId);
      },
      error: (error) => {
        console.error('Error al eliminar documento:', error);
      }
    });
  }

  // MODAL
  @ViewChild('modal') modal!: ModalComponent;

  openModal(document?: any) {
    this.documentForm.reset();
    this.successMessage = '';
    this.errorMessage = '';

    if (document) {
      this.documentId = document.document_id;
      this.documentForm.patchValue({
        title: document.title,
        content: document.content,
        effective_date: document.effective_date
      });
    } else {
      this.documentId = null;
    }

    this.modal.open();
  }

}
