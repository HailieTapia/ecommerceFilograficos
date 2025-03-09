import { Component } from '@angular/core';
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
  selectedPeriodo: string = 'mes';
  config: any = [];
  constructor(private securityService: SecurityService) {}

  ngOnInit(): void {
    this.getConfig();
    this.getFailedLoginAttempts(this.selectedPeriodo);
  }
  getConfig(): void {
    this.securityService.getConfig().subscribe(
      (response) => {
        console.log(response)
        this.config = response;
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Error al obtener datos';
        console.error('Error al obtener datos:', errorMessage);
      }
    );
  }
  
  desbloquearUsuario(user_id: string): void {
    if (!confirm('¿Estás seguro de que deseas desbloquear este usuario?')) {
      return;
    }
  
    this.securityService.adminUnlockUser(user_id).subscribe(
      (response) => {
        console.log('Usuario desbloqueado con éxito:', response);
        alert('Usuario desbloqueado con éxito');
        this.getFailedLoginAttempts(this.selectedPeriodo); 
      },
      (error) => {
        console.error('Error al desbloquear el usuario:', error);
        alert('Error al desbloquear el usuario: ' + (error?.error?.message || 'Intente de nuevo'));
      }
    );
  }
  
  //usuario cambia el período seleccionado.
  onPeriodoChange(): void {
    this.getFailedLoginAttempts(this.selectedPeriodo);
  }

  // Obtener intentos fallidos de inicio de sesión
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
