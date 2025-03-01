import { Component, OnInit } from '@angular/core';
import { CollaboratorsService } from '../../services/collaborators.service';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-collaborators',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './collaborators.component.html',
  styleUrl: './collaborators.component.css'
})
export class CollaboratorsComponent implements OnInit {
  collaborator: any; // Variable para almacenar el colaborador
  collaboratorId: number = 1; // ID del colaborador que deseas obtener (puedes modificarlo según el caso)

  newCollaborator = {
    name: '',
    collaborator_type: '',
    email: '',
    phone: '',
    logo: ''
  };
  constructor(private collaboratorsService: CollaboratorsService) { }
  ngOnInit(): void {
    this.getCollaboratorById(this.collaboratorId);
  }

  // Obtener colaborador por ID
  getCollaboratorById(id: number): void {
    this.collaboratorsService.getCollaboratorById(id).subscribe({
      next: (data) => {
        console.log('Colaborador encontrado:', data);
        this.collaborator = data.collaborator; // Asegúrate de ajustar el nombre de la propiedad de acuerdo con tu respuesta
      },
      error: (err) => {
        console.error('Error al obtener el colaborador:', err);
        alert('Hubo un error al obtener al colaborador');
      }
    });
  }

  // Obtener todos los tipos activos
  getAllCollaborators(): void {
    this.collaboratorsService.getAllCollaborators().subscribe({
      next: (data) => {
        console.log(data);
      },
      error: (err) => {
        console.error('Error al obtener los tipos de correo electrónico:', err);
      }
    });
  }

  // Crear colaborador
  createCollaborator(): void {
    this.collaboratorsService.createCollaborator(this.newCollaborator).subscribe({
      next: (data) => {
        console.log('Colaborador creado con éxito:', data);
        alert('Colaborador creado exitosamente');
        this.resetForm();
      },
      error: (err) => {
        console.error('Error al crear colaborador:', err);
        alert('Hubo un error al crear al colaborador');
      }
    });
  }

  // Limpiar el formulario
  resetForm(): void {
    this.newCollaborator = {
      name: '',
      collaborator_type: '',
      email: '',
      phone: '',
      logo: ''
    };
  }
}