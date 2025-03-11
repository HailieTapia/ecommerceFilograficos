import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SecurityService } from '../../services/security.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toastService';
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
  config: any = {};
  isEditing: boolean = false; 
  selectedTab: string = 'seguridad'; 

  constructor(private securityService: SecurityService, private toastService: ToastService,) { }

  ngOnInit(): void {
    this.getConfig();
    this.getFailedLoginAttempts(this.selectedPeriodo);
  }
  // Método para cambiar la pestaña activa
  selectTab(tab: string): void {
    this.selectedTab = tab;
  }
  //obtener configuracion existente 
  getConfig(): void {
    this.securityService.getConfig().subscribe(
      (response) => {
        this.config = response.config;
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Error al obtener los datos de seguridad';
        this.toastService.showToast(errorMessage, 'error');
      }
    );
  }

  // Función para activar el modo de edición
  editConfig(): void {
    this.isEditing = true;
  }

  // Función para guardar los cambios usando el servicio
  saveConfig(): void {
    this.isEditing = false;
    this.securityService.updateTokenLifetime(this.config).subscribe(
      (response) => {
        this.toastService.showToast('Configuración guardada', 'success');
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Error al guardar los datos.';
        this.toastService.showToast(errorMessage, 'error');
      }
    );
  }

  //desbloquear
  desbloquearUsuario(user_id: string): void {
    this.toastService.showToast(
      '¿Estás seguro de que deseas desbloquear a este usuario? Esta acción no se puede deshacer.',
      'warning',
      'Confirmar',
      () => {
        this.securityService.adminUnlockUser(user_id).subscribe(
          (response) => {
            this.toastService.showToast(response.message || 'Usuario desbloqueado con éxito', 'success');
            this.getFailedLoginAttempts(this.selectedPeriodo);
          },
          (error) => {
            const errorMessage = error?.error?.message || 'Error al desbloquear el usuario.';
            this.toastService.showToast(errorMessage, 'error');
          }
        );
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
        this.failedLoginAttempts = [
          ...(data?.clientes || []),
          ...(data?.administradores || [])
        ];
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Error al obtener intentos fallidos';
        this.toastService.showToast(errorMessage, 'error');
      }
    );
  }
  get blockedUsers(): any[] {
    return this.failedLoginAttempts.filter(a => a.estado === 'bloqueado_permanente');
  }
}
