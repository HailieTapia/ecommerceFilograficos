import { Component, OnInit, ViewChild } from '@angular/core';
import { RegulatoryService } from '../../services/regulatory.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { ModalComponent } from '../../../modal/modal.component';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';

// Registrar los datos de localización para español
registerLocaleData(localeEs);

@Component({
  selector: 'app-regulatory',
  standalone: true,
  imports: [ModalComponent, CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './regulatory.component.html',
  styleUrl: './regulatory.component.css',
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
})
export class RegulatoryComponent implements OnInit {
  documentForm: FormGroup;
  documents: any[] = [];
  documentId: number | null = null;
  successMessage: string = '';
  errorMessage: string = '';
  versionHistory: any[] = [];
  documentData: any = {};
  file: File | null = null;
  titleOptions = ['Política de privacidad', 'Términos y condiciones', 'Deslinde legal'];
  currentVersion: any = null;

  constructor(
    private fb: FormBuilder,
    private regulatoryService: RegulatoryService,
    private datePipe: DatePipe
  ) {
    this.documentForm = this.fb.group({
      title: ['', Validators.required],
      effective_date: ['', Validators.required],
      file: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.getAllCurrentVersions();
  }

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

  deleteVersion(versionId: number) {
    if (!this.documentId) {
      console.error('No se ha seleccionado un documento.');
      return;
    }

    const confirmDelete = confirm('¿Estás seguro de que deseas eliminar esta versión?');
    if (!confirmDelete) {
      return;
    }

    this.regulatoryService.deleteRegulatoryDocumentVersion(this.documentId, versionId).subscribe({
      next: () => {
        this.versionHistory = this.versionHistory.filter(v => v.version_id !== versionId);
        console.log(`Versión ${versionId} eliminada con éxito.`);
        this.getAllCurrentVersions();
        if (this.versionHistory.length === 0) {
          this.historyModal.close();
        }
      },
      error: (error) => {
        console.error('Error al eliminar la versión:', error);
      }
    });
  }

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

  saveRegulatoryDocument(): void {
    if (this.documentForm.invalid) {
      console.log('Por favor, complete todos los campos requeridos y seleccione un archivo.');
      return;
    }

    const formData = this.documentForm.value;
    const title = formData.title;
    const effective_date = formData.effective_date;
    const file = formData.file;

    if (this.documentId) {
      this.regulatoryService.updateRegulatoryDocument(this.documentId, file, effective_date).subscribe({
        next: () => {
          console.log('Documento actualizado exitosamente.');
          this.getAllCurrentVersions();
          this.modal.close();
          this.documentForm.reset();
        },
        error: (error) => {
          console.error('Error al actualizar documento:', error);
        }
      });
    } else {
      this.regulatoryService.createRegulatoryDocument(file, title, effective_date).subscribe({
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

  onFileChange(event: any): void {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      const file = fileList[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        this.file = file;
        this.documentForm.get('file')?.setValue(file);
      } else {
        alert('Por favor, selecciona un archivo .docx válido.');
        this.file = null;
        this.documentForm.get('file')?.setValue(null);
      }
    }
  }

  @ViewChild('historyModal') historyModal!: ModalComponent;
  openHistoryModal(documentId: number): void {
    this.getVersionHistory(documentId);
    this.historyModal.open();
  }

  @ViewChild('currentVersionModal') currentVersionModal!: ModalComponent;
  viewCurrentVersion(documentId: number): void {
    this.currentVersion = null;
    this.regulatoryService.getCurrentVersionById(documentId).subscribe({
      next: (response) => {
        this.currentVersion = response.DocumentVersions[0];
        this.currentVersionModal.open();
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
    this.file = null;
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

  formatDate(date: string): string {
    return this.datePipe.transform(date, "d 'de' MMMM 'de' yyyy", undefined, 'es') || 'Fecha no disponible';
  }
}