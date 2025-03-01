import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ToastComponent } from '../../administrator/shared/toast/toast.component';
import { ToastService } from '../../services/toastService';
import { PersonalInfoComponent } from './personal-info/personal-info.component';
import { AddressesComponent } from './addresses/addresses.component';
import { Router } from '@angular/router';
import { ChangePasswordComponent } from './change-password/change-password.component';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [AddressesComponent, ChangePasswordComponent, PersonalInfoComponent, ToastComponent, FormsModule, ReactiveFormsModule, CommonModule],
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
    private router: Router // Inyectamos Router para redirigir
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
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.');
  
    if (confirmDelete) {
      this.userService.deleteMyAccount().subscribe(
        (response) => {
          console.log(response.message); // Muestra un mensaje de éxito
          this.toastService.showToast('Cuenta eliminada exitosamente', 'success');
          // Redirigir al usuario a la página de login después de eliminar la cuenta
          this.router.navigate(['/login']);
        },
        (error) => {
          console.log(error.message); // Muestra el mensaje de error
          this.toastService.showToast('Hubo un error al eliminar tu cuenta', 'error');
        }
      );
    }
  }  
}