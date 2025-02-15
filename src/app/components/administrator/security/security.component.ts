import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SecurityService } from '../../services/security.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './security.component.html',
  styleUrl: './security.component.css'
})
export class SecurityComponent {

  failedAttempts: any[] = [];
  failedLoginAttempts: any[] = [];
  selectedPeriodo: string = 'dia';

  constructor(private securityService: SecurityService) {
  }

  //componente de carga al ejecutar el componente
  ngOnInit(): void {
    //obtiene los intentos fallidos al cargar
    this.getFailedLoginAttempts(this.selectedPeriodo);
  }

  desbloquearUsuario(user_id: string): void {
    this.securityService.adminUnlockUser(user_id).subscribe(
      (response) => {
        console.log('Usuario desbloqueado con éxito:', response);
      },
      (error) => {
        console.error('Error al desbloquear el usuario:', error);
      }
    );
  }

  //usuario cambia el período seleccionado.
  onPeriodoChange(): void {
    this.getFailedLoginAttempts(this.selectedPeriodo);
  }

  // Obtener intentos fallidos de inicio de sesión
  //Hace una petición a un servicio para obtener los intentos fallidos de inicio de sesión del período especificado
  getFailedLoginAttempts(periodo: string): void {
    this.securityService.getFailedLoginAttempts(periodo).subscribe(
      (data) => {
        console.log('Intentos fallidos:', data);
        this.failedLoginAttempts = [
          ...(data?.clientes || []),
          ...(data?.administradores || [])
        ];
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Error al obtener intentos fallidos';
        console.error('Error al obtener intentos fallidos:', errorMessage);
      }
    );
  }
}
