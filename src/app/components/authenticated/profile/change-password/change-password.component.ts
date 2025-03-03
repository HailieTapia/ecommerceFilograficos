import { Component } from '@angular/core';
import { PasswordService } from '../../../services/password.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PasswordComponent } from '../../../administrator/shared/password/password.component';
import { ToastService } from '../../../services/toastService';
import { PasswordToggleComponent } from '../../../administrator/shared/password-toggle/password-toggle.component';
@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [PasswordToggleComponent,PasswordComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;

  constructor(
    private toastService: ToastService,
    private fb: FormBuilder,
    private passwordService: PasswordService
  ) {
    // Inicializamos el formulario vacío; PasswordComponent agregará los controles
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required] // Campo para la contraseña actual
    });
  }

  onSubmit(): void {
    if (this.changePasswordForm.valid) {
      const formData = {
        currentPassword: this.changePasswordForm.value.currentPassword,
        newPassword: this.changePasswordForm.value.password
      };

      this.passwordService.changePassword(formData).subscribe(
        response => {
          const successMessage = response?.message || 'Contraseña cambiada exitosamente';
          this.toastService.showToast(successMessage, 'success');
        },
        error => {
          const errorMessage = error?.error?.message || 'Error al cambiar la contraseña';
          this.toastService.showToast(errorMessage, 'error');
        }
      );
    } else {
      this.toastService.showToast('El formulario no es válido', 'error');
      this.changePasswordForm.markAllAsTouched();
    }
  }
}