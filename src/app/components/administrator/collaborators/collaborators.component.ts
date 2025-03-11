import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CollaboratorsService } from '../../services/collaborators.service';
import { ModalComponent } from '../../../modal/modal.component';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toastService';

@Component({
  selector: 'app-collaborators',
  standalone: true,
  imports: [CommonModule, ModalComponent, ReactiveFormsModule],
  templateUrl: './collaborators.component.html',
  styleUrl: './collaborators.component.css'
})
export class CollaboratorsComponent implements OnInit, AfterViewInit {
  @ViewChild('modal') modal!: ModalComponent;
  collaborators: any[] = [];
  collaboratorNew!: FormGroup;
  selectedColaId: number | null = null;
  selectedFile: File | null = null; // To store the selected file

  constructor(
    private toastService: ToastService,
    private collaboratorsService: CollaboratorsService,
    private fb: FormBuilder
  ) {
    this.collaboratorNew = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      collaborator_type: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern('^[0-9]+$'), Validators.minLength(8), Validators.maxLength(15)]],
      contact: ['', [Validators.maxLength(255)]],
      logo: []
    });
  }

  ngOnInit(): void {
    this.getAllCollaborators();
  }

  // Obtener todos los colaboradores
  getAllCollaborators(): void {
    this.collaboratorsService.getAllCollaborators().subscribe({
      next: (data) => {
        this.collaborators = data;
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener colaboradores';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }
  
  //eliminar colaborador 
  deleteColaborators(colabId: number): void {
    this.toastService.showToast(
      '¿Estás seguro de que deseas eliminar este colaborator? Esta acción no se puede deshacer.',
      'warning',
      'Confirmar',
      () => {
        this.collaboratorsService.deleteCollaborator(colabId).subscribe({
          next: (response) => {
            this.toastService.showToast(response.message || 'Categoría eliminada exitosamente', 'success');
            this.getAllCollaborators();
          },
          error: (error) => {
            const errorMessage = error?.error?.message || 'Error al eliminar la categoría';
            this.toastService.showToast(errorMessage, 'error');
          }
        });
      }
    );
  }

  // Handle file selection
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  // Crear o actualizar
  saveCollaborators(): void {
    const formData = new FormData();
    const collaboratorData = this.collaboratorNew.value;

    // Append form fields to FormData
    Object.keys(collaboratorData).forEach(key => {
      if (key !== 'logo' && collaboratorData[key]) {
        formData.append(key, collaboratorData[key]);
      }
    });

    // Append file if selected
    if (this.selectedFile) {
      formData.append('logo', this.selectedFile);
    }

    if (this.selectedColaId) {
      this.collaboratorsService.updateCollaborator(this.selectedColaId, formData).subscribe({
        next: () => {
          this.toastService.showToast(`Colaborador actualizado exitosamente.`, 'success');
          this.getAllCollaborators();
          this.modal.close();
          this.resetForm();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al actualizar el colaborador';
          this.toastService.showToast(errorMessage, 'error');
        }
      });
    } else {
      this.collaboratorsService.createCollaborator(formData).subscribe({
        next: () => {
          this.toastService.showToast(`Colaborador creado exitosamente.`, 'success');
          this.getAllCollaborators();
          this.modal.close();
          this.resetForm();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al crear colaborador';
          this.toastService.showToast(errorMessage, 'error');
        }
      });
    }
  }

  // Reset form and file
  resetForm(): void {
    this.collaboratorNew.reset();
    this.selectedFile = null;
    this.selectedColaId = null;
  }

  // MODAL
  openEditModal(colaboradorId: number): void {
    this.selectedColaId = colaboradorId;
    this.collaboratorsService.getCollaboratorById(colaboradorId).subscribe({
      next: (colaborador) => {
        if (colaborador?.active) {
          this.collaboratorNew.patchValue({
            name: colaborador.name,
            collaborator_type: colaborador.collaborator_type,
            email: colaborador.email,
            phone: colaborador.phone,
            contact: colaborador.contact,
            logo: colaborador.logo

          });
          this.modal.open();
        } else {
          this.toastService.showToast('El colaborador no está disponible para edición.', 'info');
        }
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener el colaborador';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.modal) {
      this.toastService.showToast('El modal no está inicializado correctamente.', 'info');
    }
  }

  openModal(): void {
    this.resetForm();
    this.modal.open();
  }
}