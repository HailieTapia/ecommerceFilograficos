import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
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
  selectedFile: File | null = null;

  constructor(
    private toastService: ToastService,
    private userService: UserService,
    private authService: AuthService,
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

  // Método para obtener las iniciales del nombre
  getInitials(name: string): string {
    if (!name) return '??';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + (words[1] ? words[1][0] : words[0][1] || '')).toUpperCase();
  }

  // Método para manejar la selección de archivo
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadProfilePicture();
    }
  }

  // Método para subir la foto de perfil
  uploadProfilePicture(): void {
    if (!this.selectedFile) {
      this.toastService.showToast('Por favor, selecciona una imagen', 'error');
      return;
    }

    this.userService.uploadProfilePicture(this.selectedFile).subscribe(
      (response) => {
        this.userProfile.Account = {
          ...this.userProfile.Account,
          profile_picture_url: response.profile_picture_url
        };
        this.authService.updateUserProfile(this.userProfile);
        this.toastService.showToast('Foto de perfil actualizada exitosamente', 'success');
        this.selectedFile = null;
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Error al subir la foto de perfil';
        this.toastService.showToast(errorMessage, 'error');
        this.selectedFile = null;
      }
    );
  }

  // Método para eliminar la foto de perfil
  deleteProfilePicture(): void {
    this.userService.deleteProfilePicture().subscribe(
      () => {
        this.userProfile.Account = {
          ...this.userProfile.Account,
          profile_picture_url: null
        };
        this.authService.updateUserProfile(this.userProfile);
        this.toastService.showToast('Foto de perfil eliminada exitosamente', 'success');
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Error al eliminar la foto de perfil';
        this.toastService.showToast(errorMessage, 'error');
      }
    );
  }

  // Método para manejar la actualización del perfil desde el componente hijo
  onProfileUpdated(updatedProfile: any): void {
    this.userProfile = { ...this.userProfile, ...updatedProfile };
    this.authService.updateUserProfile(updatedProfile);
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