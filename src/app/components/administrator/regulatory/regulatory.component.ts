import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { RegulatoryService } from '../../../services/regulatory.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { ModalComponent } from '../../reusable/modal/modal.component';
import { ToastService } from '../../../services/toastService';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';
import { Subscription } from 'rxjs';

registerLocaleData(localeEs);

@Component({
  selector: 'app-regulatory',
  standalone: true,
  imports: [ModalComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './regulatory.component.html',
  styleUrls: ['./regulatory.component.css'],
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
})
export class RegulatoryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('modal') modal!: ModalComponent;
  @ViewChild('historyModal') historyModal!: ModalComponent;
  @ViewChild('currentVersionModal') currentVersionModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

  documentForm: FormGroup;
  documents: any[] = [];
  documentId: number | null = null;
  versionHistory: any[] = [];
  documentData: any = {};
  file: File | null = null;
  titleOptions = ['Política de privacidad', 'Términos y condiciones', 'Deslinde legal'];
  currentVersion: any = null;
  confirmAction: (() => void) | null = null;
  confirmModalTitle: string = '';
  confirmModalMessage: string = '';
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';

  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private regulatoryService: RegulatoryService,
    private datePipe: DatePipe,
    private toastService: ToastService
  ) {
    this.documentForm = this.fb.group({
      title: ['', Validators.required],
      effective_date: ['', [Validators.required, this.dateNotBeforeToday.bind(this)]],
      file: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.getAllCurrentVersions();
  }

  ngAfterViewInit(): void {
    if (!this.modal || !this.historyModal || !this.currentVersionModal || !this.confirmModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  dateNotBeforeToday(control: any) {
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today ? { dateBeforeToday: true } : null;
  }

  getAllCurrentVersions(): void {
    this.subscriptions.add(
      this.regulatoryService.getAllCurrentVersions().subscribe({
        next: (response) => {
          this.documents = response;
          this.toastService.showToast('Documentos cargados exitosamente.', 'success');
        },
        error: (error) => {
          const errorMessage = error?.error?.message || 'Error al obtener los documentos';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  getVersionHistory(documentId: number): void {
    this.documentId = documentId;
    this.subscriptions.add(
      this.regulatoryService.getVersionHistory(documentId).subscribe({
        next: (data) => {
          this.versionHistory = data.DocumentVersions;
          this.historyModal.title = 'Historial de Versiones';
          this.historyModal.modalType = 'info';
          this.historyModal.isConfirmModal = false;
          this.historyModal.open();
          this.toastService.showToast('Historial de versiones cargado exitosamente.', 'success');
        },
        error: (error) => {
          const errorMessage = error?.error?.message || 'Error al obtener el historial';
          this.toastService.showToast(errorMessage, 'error');
          this.versionHistory = [];
        }
      })
    );
  }

  openConfirmModal(title: string, message: string, modalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default', action: () => void) {
    if (!this.confirmModal) {
      this.toastService.showToast('Error: Modal de confirmación no inicializado', 'error');
      return;
    }
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmModalType = modalType;
    this.confirmAction = action;
    this.confirmModal.title = title;
    this.confirmModal.modalType = modalType;
    this.confirmModal.isConfirmModal = true;
    this.confirmModal.confirmText = 'Confirmar';
    this.confirmModal.cancelText = 'Cancelar';
    this.confirmModal.open();
  }

  handleConfirm(): void {
    if (this.confirmAction) {
      this.confirmAction();
      this.confirmAction = null;
    }
  }

  deleteVersion(versionId: number) {
    if (!this.documentId) {
      this.toastService.showToast('No se ha seleccionado un documento.', 'error');
      return;
    }

    this.openConfirmModal(
      'Eliminar Versión',
      `¿Estás seguro de que deseas eliminar la versión ${versionId}?`,
      'danger',
      () => {
        this.subscriptions.add(
          this.regulatoryService.deleteRegulatoryDocumentVersion(this.documentId!, versionId).subscribe({
            next: () => {
              this.versionHistory = this.versionHistory.filter(v => v.version_id !== versionId);
              this.toastService.showToast(`Versión ${versionId} eliminada exitosamente.`, 'success');
              this.getAllCurrentVersions();
              if (this.versionHistory.length === 0 && this.historyModal) {
                this.historyModal.close();
              }
            },
            error: (error) => {
              const errorMessage = error?.error?.message || 'Error al eliminar la versión';
              this.toastService.showToast(errorMessage, 'error');
            }
          })
        );
      }
    );
  }

  deleteRegulatoryDocument(documentId: number): void {
    this.openConfirmModal(
      'Eliminar Documento',
      `¿Estás seguro de que deseas eliminar este documento?`,
      'danger',
      () => {
        this.subscriptions.add(
          this.regulatoryService.deleteRegulatoryDocument(documentId).subscribe({
            next: () => {
              this.documents = this.documents.filter(doc => doc.id !== documentId);
              this.toastService.showToast('Documento eliminado exitosamente.', 'success');
              if (this.confirmModal) this.confirmModal.close();
            },
            error: (error) => {
              const errorMessage = error?.error?.message || 'Error al eliminar el documento';
              this.toastService.showToast(errorMessage, 'error');
            }
          })
        );
      }
    );
  }

  saveRegulatoryDocument(): void {
    if (this.documentForm.invalid) {
      this.documentForm.markAllAsTouched();
      this.toastService.showToast('Por favor, complete todos los campos requeridos y seleccione un archivo válido.', 'error');
      return;
    }

    const formData = this.documentForm.value;
    const title = formData.title;
    const effective_date = formData.effective_date;
    const file = formData.file;

    this.subscriptions.add(
      (this.documentId
        ? this.regulatoryService.updateRegulatoryDocument(this.documentId, file, effective_date)
        : this.regulatoryService.createRegulatoryDocument(file, title, effective_date)
      ).subscribe({
        next: () => {
          this.toastService.showToast(
            this.documentId ? 'Documento actualizado exitosamente.' : 'Documento creado exitosamente.',
            'success'
          );
          this.getAllCurrentVersions();
          this.documentForm.reset();
          this.file = null;
          this.modal.close();
        },
        error: (error) => {
          const errorMessage = error?.error?.message || `Error al ${this.documentId ? 'actualizar' : 'crear'} el documento`;
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  onFileChange(event: any): void {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      const file = fileList[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        this.file = file;
        this.documentForm.get('file')?.setValue(file);
      } else {
        this.file = null;
        this.documentForm.get('file')?.setValue(null);
        this.toastService.showToast('Por favor, selecciona un archivo .docx válido.', 'error');
      }
    }
  }

  openHistoryModal(documentId: number): void {
    this.getVersionHistory(documentId);
  }

  viewCurrentVersion(documentId: number): void {
    this.currentVersion = null;
    this.subscriptions.add(
      this.regulatoryService.getCurrentVersionById(documentId).subscribe({
        next: (response) => {
          this.currentVersion = response.DocumentVersions[0];
          this.currentVersionModal.title = 'Versión Vigente';
          this.currentVersionModal.modalType = 'info';
          this.currentVersionModal.isConfirmModal = false;
          this.currentVersionModal.open();
          this.toastService.showToast('Versión vigente cargada exitosamente.', 'success');
        },
        error: (error) => {
          const errorMessage = error?.error?.message || 'Error al obtener la versión vigente';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  openModal(document?: any) {
    if (!this.modal) {
      this.toastService.showToast('Error: Modal de documento no inicializado', 'error');
      return;
    }
    this.documentForm.reset();
    this.file = null;
    this.documentId = null;
    if (document) {
      this.documentId = document.document_id;
      this.documentForm.patchValue({
        title: document.title,
        effective_date: this.formatDateForInput(document.effective_date)
      });
      this.modal.title = 'Editar Documento';
      this.modal.modalType = 'info';
    } else {
      this.modal.title = 'Crear Documento';
      this.modal.modalType = 'success';
    }
    this.modal.isConfirmModal = false;
    this.modal.open();
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, "d 'de' MMMM 'de' yyyy", undefined, 'es') || 'Fecha no disponible';
  }

  formatDateForInput(date: string): string {
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
  }
}