import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
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
    private fb: FormBuilder,
    private router: Router 
  ) {
  }

  ngOnInit(): void {
    this.getUserInfo();
  }
  // Obtener la información de la empresa
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

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
  // Eliminar la cuenta del usuario
  deleteAccount() {
    this.toastService.showToast(
      '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.',
      'warning',
      'Confirmar',
      () => {
        this.userService.deleteMyAccount().subscribe(
          (response) => {
            this.toastService.showToast('Cuenta eliminada exitosamente', 'success');
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