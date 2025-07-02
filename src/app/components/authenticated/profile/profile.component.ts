import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service'; // Importar AuthService
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../services/toastService';
import { PersonalInfoComponent } from './personal-info/personal-info.component';
import { AddressesComponent } from './addresses/addresses.component';
import { Router } from '@angular/router';
import { ChangePasswordComponent } from './change-password/change-password.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [AddressesComponent, ChangePasswordComponent, PersonalInfoComponent, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  userProfile: any = {};
  successMessage: string = '';
  errorMessage: string = '';
  activeTab: string = 'info';
  addAddressId: number | null = null;

  constructor(
    private toastService: ToastService,
    private userService: UserService,
    private authService: AuthService, // Inyectar AuthService
    private router: Router 
  ) {}

  ngOnInit(): void {
    this.getUserInfo();
  }

  getUserInfo(): void {
    this.userService.getProfile().subscribe(
      (profile) => {
        this.userProfile = profile;
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Error al obtener el perfil';
        this.toastService.showToast(errorMessage, 'error');
      }
    );
  }

  // Método para manejar la actualización del perfil desde el componente hijo
  onProfileUpdated(updatedProfile: any): void {
    this.userProfile = { ...this.userProfile, ...updatedProfile }; // Actualizar userProfile
    this.authService.updateUserProfile(updatedProfile); // Sincronizar con AuthService
    this.toastService.showToast('Perfil actualizado exitosamente', 'success');
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  deleteAccount() {
    this.toastService.showToast(
      '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.',
      'warning',
      'Confirmar',
      () => {
        this.userService.deleteMyAccount().subscribe(
          (response) => {
            this.toastService.showToast(response.message || 'Cuenta eliminada exitosamente', 'success');
            this.router.navigate(['/login']);
          },
          (error) => {
            const errorMessage = error?.error?.message || 'Error al eliminar tu cuenta';
            this.toastService.showToast(errorMessage, 'error');
          }
        );
      }
    );
  }  
}