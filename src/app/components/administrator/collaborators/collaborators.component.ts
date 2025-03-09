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

  constructor(private toastService: ToastService, private collaboratorsService: CollaboratorsService, private fb: FormBuilder) {
    this.collaboratorNew = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      collaborator_type: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern('^[0-9]+$'), Validators.minLength(8), Validators.maxLength(15)]],
      logo: ['', [Validators.pattern('https?://.+')]],
      contact: ['', [Validators.maxLength(255)]]
    });
  }

  ngOnInit(): void {
    this.getAllCollaborators();
  }
  //Modal
  ngAfterViewInit(): void {
    if (!this.modal) {
      this.toastService.showToast('El modal no está inicializado correctamente.', 'info');
    }
  }
  openModal(): void {
    this.collaboratorNew.reset();
    this.modal.open();
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
  //Crear Colaborador
  createCollaborator(): void {
    const collaboratorData = this.collaboratorNew.value;
    this.collaboratorsService.createCollaborator(collaboratorData).subscribe({
      next: (data) => {
        this.toastService.showToast(`Colaborador creado exitosamente.`, 'success');
        this.getAllCollaborators();
        this.modal.close();
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al crear colaborador';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }
}
