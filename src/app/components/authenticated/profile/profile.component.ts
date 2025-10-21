import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toastService';
import { PersonalInfoComponent } from './personal-info/personal-info.component';
import { AddressesComponent } from './addresses/addresses.component';
import { Router } from '@angular/router';
import { ChangePasswordComponent } from './change-password/change-password.component';

interface Badge {
  id: number;
  name: string;
  icon_url: string;
  description: string;
  category: string;
  obtained_at: string;
  product_category: string | null; // Added product_category
}

interface UserProfile {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  user_type: string;
  address: any;
  profile_picture_url: string | null;
  badges: Badge[];
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [AddressesComponent, ChangePasswordComponent, PersonalInfoComponent, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  userProfile: UserProfile | any = {};
  successMessage: string = '';
  errorMessage: string = '';
  activeTab: string = 'info';
  addAddressId: number | null = null;
  selectedFile: File | null = null;
  showTooltip: boolean = false;

  constructor(
    private elRef: ElementRef,
    private toastService: ToastService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const tooltip = this.elRef.nativeElement.querySelector('.tooltip');
    const button = this.elRef.nativeElement.querySelector('.h-24.w-24');
    const clickedInside = (tooltip && tooltip.contains(target)) || (button && button.contains(target));
    if (!clickedInside && this.showTooltip) {
      this.showTooltip = false;
    }
  }

  ngOnInit(): void {
    this.getUserInfo();
  }

  toggleTooltip(): void {
    this.showTooltip = !this.showTooltip;
  }

  getUserInfo(): void {
    this.userService.getProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        console.log('Perfil del usuario:', this.userProfile);
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Error al obtener el perfil';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  getInitials(name: string | undefined | null): string {
    if (!name || name.trim() === '') return 'sin foto';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + (words[1] ? words[1][0] : words[0][1] || '')).toUpperCase();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadProfilePicture();
    }
  }

  uploadProfilePicture(): void {
    if (!this.selectedFile) {
      this.toastService.showToast('Por favor, selecciona una imagen', 'error');
      return;
    }

    this.userService.uploadProfilePicture(this.selectedFile).subscribe({
      next: (response) => {
        this.userProfile.profile_picture_url = response.profile_picture_url;
        this.authService.updateUserProfile(this.userProfile);
        this.toastService.showToast('Foto de perfil actualizada exitosamente', 'success');
        this.selectedFile = null;
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Error al subir la foto de perfil';
        this.toastService.showToast(errorMessage, 'error');
        this.selectedFile = null;
      }
    });
  }

  deleteProfilePicture(): void {
    this.userService.deleteProfilePicture().subscribe({
      next: () => {
        this.userProfile.profile_picture_url = null;
        this.authService.updateUserProfile(this.userProfile);
        this.toastService.showToast('Foto de perfil eliminada exitosamente', 'success');
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Error al eliminar la foto de perfil';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  onProfileUpdated(updatedProfile: any): void {
    this.userProfile = { ...this.userProfile, ...updatedProfile };
    this.authService.updateUserProfile(this.userProfile);
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
        this.userService.deleteMyAccount().subscribe({
          next: (response) => {
            this.toastService.showToast(response.message || 'Cuenta eliminada exitosamente', 'success');
            this.router.navigate(['/login']);
          },
          error: (error) => {
            const errorMessage = error?.error?.message || 'Error al eliminar tu cuenta';
            this.toastService.showToast(errorMessage, 'error');
          }
        });
      }
    );
  }
}