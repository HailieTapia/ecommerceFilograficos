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
  versionHistory: any[] = [];
  documentData: any = {};
  file: File | null = null; // Variable para almacenar el archivo seleccionado
  titleOptions = ['Política de privacidad', 'Términos y condiciones', 'Deslinde legal']; // Opciones para el select
  currentVersion: any = null; // Variable para almacenar la versión actual

  constructor(
    private fb: FormBuilder,
    private regulatoryService: RegulatoryService
  ) {
    this.documentForm = this.fb.group({
      title: ['', Validators.required], // Select para el título
      effective_date: ['', Validators.required], // Fecha efectiva
      file: [null, Validators.required] // Campo para el archivo
    });
  }

  ngOnInit(): void {
    this.getAllCurrentVersions();
  }

  // Obtener todas las versiones vigentes
  getAllCurrentVersions(): void {
    this.regulatoryService.getAllCurrentVersions().subscribe(
      (response) => {
        this.documents = response;
      },
      (error) => {
        console.error('Error al obtener:', error);
      }
    );
  }

  // Obtener historial de versiones
  getVersionHistory(documentId: number): void {
    this.documentId = documentId;
    this.regulatoryService.getVersionHistory(documentId).subscribe({
      next: (data) => {
        this.versionHistory = data.DocumentVersions;
      },
      error: (error) => {
        console.error('Error al obtener el historial:', error);
        this.versionHistory = [];
      }
    });
  }

  // Eliminar versión
  deleteVersion(versionId: number) {
    if (!this.documentId) {
      console.error('No se ha seleccionado un documento.');
      return;
    }

    // Pedir confirmación antes de eliminar
    const confirmDelete = confirm('¿Estás seguro de que deseas eliminar esta versión?');
    if (!confirmDelete) {
      return; // Si el usuario cancela, no hacer nada
    }

    this.regulatoryService.deleteRegulatoryDocumentVersion(this.documentId, versionId).subscribe({
      next: () => {
        // Filtrar la versión eliminada del historial
        this.versionHistory = this.versionHistory.filter(v => v.version_id !== versionId);
        console.log(`Versión ${versionId} eliminada con éxito.`);

        // Actualizar la lista de documentos en la tabla
        this.getAllCurrentVersions();

        // Si el historial está vacío, cerrar el modal
        if (this.versionHistory.length === 0) {
          this.historyModal.close();
        }
      },
      error: (error) => {
        console.error('Error al eliminar la versión:', error);
      }
    });
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
  
  // RegulatoryComponent (saveRegulatoryDocument method)
  saveRegulatoryDocument(): void {
    if (this.documentForm.invalid) {
      console.log('Por favor, complete todos los campos requeridos y seleccione un archivo.');
      return;
    }

    const formData = this.documentForm.value;
    const title = formData.title;
    const effective_date = formData.effective_date;
    const file = formData.file; // Obtener el archivo desde el FormGroup

    if (this.documentId) {
      // Lógica para actualizar un documento existente
      this.regulatoryService.updateRegulatoryDocument(this.documentId, file, effective_date).subscribe({
        next: () => {
          console.log('Documento actualizado exitosamente.');
          this.getAllCurrentVersions(); // Refrescar la lista de documentos
          this.modal.close(); // Cerrar el modal
          this.documentForm.reset(); // Reiniciar el formulario
        },
        error: (error) => {
          console.error('Error al actualizar documento:', error);
        }
      });
    } else {
      // Lógica para crear un nuevo documento
      this.regulatoryService.createRegulatoryDocument(file, title, effective_date).subscribe({
        next: () => {
          console.log('Documento creado exitosamente.');
          this.getAllCurrentVersions(); // Refrescar la lista de documentos
          this.documentForm.reset(); // Reiniciar el formulario
          this.modal.close(); // Cerrar el modal
        },
        error: (error) => {
          console.error('Error al crear documento:', error);
        }
      });
    }
  }

  // Manejar la selección de archivos
  onFileChange(event: any): void {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      const file = fileList[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        this.file = file;
        this.documentForm.get('file')?.setValue(file); // Actualizar el control 'file' en el FormGroup
      } else {
        alert('Por favor, selecciona un archivo .docx válido.');
        this.file = null;
        this.documentForm.get('file')?.setValue(null); // Limpiar el control 'file' en el FormGroup
      }
    }
  }

  // MODALES
  @ViewChild('historyModal') historyModal!: ModalComponent;
  openHistoryModal(documentId: number): void {
    this.getVersionHistory(documentId);
    this.historyModal.open();
  }

  @ViewChild('currentVersionModal') currentVersionModal!: ModalComponent;
  viewCurrentVersion(documentId: number): void {
    this.currentVersion = null; // Reiniciar la variable
    this.regulatoryService.getCurrentVersionById(documentId).subscribe({
      next: (response) => {
        this.currentVersion = response.DocumentVersions[0]; // Asignar la versión actual
        this.currentVersionModal.open(); // Abrir el modal
      },
      error: (error) => {
        console.error('Error al obtener la versión vigente:', error);
      }
    });
  }

  @ViewChild('modal') modal!: ModalComponent;
  openModal(document?: any) {
    this.documentForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
    this.file = null; // Reiniciar el archivo seleccionado
    if (document) {
      this.documentId = document.document_id;
      this.documentForm.patchValue({
        title: document.title,
        effective_date: document.effective_date
      });
    } else {
      this.documentId = null;
    }
    this.modal.open();
  }
}
