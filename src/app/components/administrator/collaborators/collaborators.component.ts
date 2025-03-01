import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators ,ReactiveFormsModule} from '@angular/forms';
import { CollaboratorsService } from '../../services/collaborators.service';
import { ModalComponent } from '../../../modal/modal.component';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-collaborators',
  standalone: true,
  imports: [CommonModule,ModalComponent,ReactiveFormsModule],
  templateUrl: './collaborators.component.html',
  styleUrl: './collaborators.component.css'
})
export class CollaboratorsComponent implements OnInit, AfterViewInit {
  @ViewChild('modal') modal!: ModalComponent; 

  collaborators: any[] = []; 
  collaboratorNew!: FormGroup;

  constructor(private collaboratorsService: CollaboratorsService, private fb: FormBuilder) {
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

  ngAfterViewInit(): void {
    if (!this.modal) {
      console.error("El modal no está inicializado correctamente.");
    }
  }

  // 🔹 Obtener todos los colaboradores
  getAllCollaborators(): void {
    this.collaboratorsService.getAllCollaborators().subscribe({
      next: (data) => {
        this.collaborators = data;
      },
      error: (err) => {
        console.error('Error al obtener colaboradores:', err);
      }
    });
  }

  // 🔹 Abrir el Modal
  openModal(): void {
    this.collaboratorNew.reset(); // Limpiar formulario antes de abrir el modal
    this.modal.open();
  }

  // 🔹 Crear Colaborador
  createCollaborator(): void {
    if (this.collaboratorNew.invalid) {
      alert('Formulario inválido. Revisa los campos.');
      return;
    }

    const collaboratorData = this.collaboratorNew.value;
  
    this.collaboratorsService.createCollaborator(collaboratorData).subscribe({
      next: (data) => {
        alert('Colaborador creado exitosamente');
        this.getAllCollaborators(); // Refrescar lista de colaboradores
        this.modal.close(); // Cerrar modal después de crear
      },
      error: (err) => {
        console.error('Error al crear colaborador:', err);
      }
    });
  }
}
