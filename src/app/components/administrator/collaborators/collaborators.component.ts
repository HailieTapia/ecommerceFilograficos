import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CollaboratorsService } from '../../../services/collaborators.service';
import { ModalComponent } from '../../reusable/modal/modal.component';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toastService';
import { PaginationComponent } from '../pagination/pagination.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-collaborators',
  standalone: true,
  imports: [PaginationComponent, CommonModule, ModalComponent, ReactiveFormsModule],
  templateUrl: './collaborators.component.html',
  styleUrl: './collaborators.component.css'
})
export class CollaboratorsComponent implements OnInit, AfterViewInit {
  @ViewChild('createEditModal') createEditModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

  collaborators: any[] = [];
  collaboratorForm!: FormGroup;
  selectedColaId: number | null = null;
  selectedFile: File | null = null;
  imagePreview: SafeUrl | string | null = null;
  total: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  confirmAction: (() => void) | null = null;
  confirmModalTitle: string = '';
  confirmModalMessage: string = '';
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';

  constructor(
    private toastService: ToastService,
    private collaboratorsService: CollaboratorsService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer
  ) {
    this.collaboratorForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      collaborator_type: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern('^[0-9]+$'), Validators.minLength(8), Validators.maxLength(15)]],
      contact: ['', [Validators.maxLength(255)]],
      logo: []
    });
  }

  ngOnInit(): void {
    this.getCollaborators();
  }

  ngAfterViewInit(): void {
    if (!this.createEditModal || !this.confirmModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }

  getCollaborators(): void {
    this.collaboratorsService
      .getCollaborators(this.currentPage, this.itemsPerPage)
      .subscribe({
        next: (data) => {
          this.collaborators = data.collaborators;
          this.total = data.total;
          this.currentPage = data.page;
          this.itemsPerPage = data.pageSize;
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al obtener colaboradores';
          this.toastService.showToast(errorMessage, 'error');
        }
      });
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.getCollaborators();
  }

  openModal(): void {
    this.resetForm();
    if (this.createEditModal) {
      this.createEditModal.modalType = 'success';
      this.createEditModal.title = 'Agregar Colaborador';
      this.createEditModal.open();
    }
  }

  openEditModal(colaboradorId: number): void {
    this.selectedColaId = colaboradorId;
    this.collaboratorsService.getCollaboratorById(colaboradorId).subscribe({
      next: (colaborador) => {
        if (colaborador?.active) {
          this.collaboratorForm.patchValue({
            name: colaborador.name,
            collaborator_type: colaborador.collaborator_type,
            email: colaborador.email,
            phone: colaborador.phone,
            contact: colaborador.contact
          });
          this.selectedFile = null;
          // Mostrar imagen existente si hay una
          this.imagePreview = colaborador.logo || null;
          if (this.createEditModal) {
            this.createEditModal.modalType = 'info';
            this.createEditModal.title = 'Editar Colaborador';
            this.createEditModal.open();
          }
        } else {
          this.toastService.showToast('El colaborador no está disponible para edición.', 'error');
        }
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener el colaborador';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  openConfirmModal(title: string, message: string, modalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default', action: () => void) {
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmModalType = modalType;
    this.confirmAction = action;
    if (this.confirmModal) {
      this.confirmModal.title = title;
      this.confirmModal.modalType = modalType;
      this.confirmModal.isConfirmModal = true;
      this.confirmModal.confirmText = 'Confirmar';
      this.confirmModal.cancelText = 'Cancelar';
      this.confirmModal.open();
    }
  }

  handleConfirm(): void {
    if (this.confirmAction) {
      this.confirmAction();
      this.confirmAction = null;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      
      if (!validTypes.includes(file.type)) {
        this.toastService.showToast('Solo se permiten imágenes JPG, PNG o WebP.', 'error');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        this.toastService.showToast('La imagen no debe exceder 2MB.', 'error');
        return;
      }
      
      this.selectedFile = file;
      // Crear vista previa de la imagen
      this.createImagePreview(file);
    }
  }

  createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = this.sanitizer.bypassSecurityTrustUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  saveCollaborator(): void {
    if (this.collaboratorForm.invalid) {
      this.collaboratorForm.markAllAsTouched();
      this.toastService.showToast('Formulario inválido. Revisa los campos.', 'error');
      return;
    }

    const formData = new FormData();
    const collaboratorData = this.collaboratorForm.value;
    Object.keys(collaboratorData).forEach(key => {
      if (key !== 'logo' && collaboratorData[key]) {
        formData.append(key, collaboratorData[key]);
      }
    });

    if (this.selectedFile) {
      formData.append('logo', this.selectedFile);
    }

    const saveAction = this.selectedColaId
      ? this.collaboratorsService.updateCollaborator(this.selectedColaId, formData)
      : this.collaboratorsService.createCollaborator(formData);

    saveAction.subscribe({
      next: () => {
        this.toastService.showToast(
          this.selectedColaId ? 'Colaborador actualizado exitosamente' : 'Colaborador creado exitosamente',
          'success'
        );
        this.getCollaborators();
        if (this.createEditModal) this.createEditModal.close();
        this.resetForm();
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al guardar colaborador';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  deleteCollaborator(colabId: number): void {
    const collaborator = this.collaborators.find(c => c.collaborator_id === colabId);
    if (!collaborator) {
      this.toastService.showToast('Colaborador no encontrado.', 'error');
      return;
    }
    this.openConfirmModal(
      'Eliminar Colaborador',
      `¿Estás seguro de que deseas eliminar el colaborador "${collaborator.name}"? Esta acción no se puede deshacer.`,
      'danger',
      () => {
        this.collaboratorsService.deleteCollaborator(colabId).subscribe({
          next: (response) => {
            this.toastService.showToast(response.message || 'Colaborador eliminado exitosamente', 'success');
            this.getCollaborators();
            if (this.confirmModal) this.confirmModal.close();
          },
          error: (err) => {
            const errorMessage = err?.error?.message || 'Error al eliminar el colaborador';
            this.toastService.showToast(errorMessage, 'error');
            if (this.confirmModal) this.confirmModal.close();
          }
        });
      }
    );
  }

  resetForm(): void {
    this.collaboratorForm.reset({ collaborator_type: '' });
    this.selectedFile = null;
    this.imagePreview = null;
    this.selectedColaId = null;
  }
}