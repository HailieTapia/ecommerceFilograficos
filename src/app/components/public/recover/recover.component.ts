import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PasswordService } from '../../services/password.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastComponent } from '../../administrator/shared/toast/toast.component';
import { ToastService } from '../../services/toastService';
@Component({
  selector: 'app-recover',
  standalone: true,
  imports: [ToastComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './recover.component.html',
  styleUrl: './recover.component.css'
})
export class RecoverComponent {
  recoveryForm: FormGroup;
  otpForm: FormGroup;
  resetForm: FormGroup;
  stage: number = 3;
  email: string = "";
  recoveryToken: string = "";

  constructor(private toastService: ToastService, private router: Router, private fb: FormBuilder, private passwordService: PasswordService) {
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    this.otpForm = this.fb.group({
      otp0: ['', [Validators.required]],
      otp1: ['', [Validators.required]],
      otp2: ['', [Validators.required]],
      otp3: ['', [Validators.required]],
      otp4: ['', [Validators.required]],
      otp5: ['', [Validators.required]],
      otp6: ['', [Validators.required]],
      otp7: ['', [Validators.required]]
    });
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
  }
  // Método para iniciar el proceso de recuperación de contraseña
  initiateRecovery() {
    if (this.recoveryForm.invalid) {
      this.toastService.showToast('Por favor ingresa un correo válido', 'error');
      return;
    }
    this.passwordService.initiatePasswordRecovery(this.recoveryForm.value).subscribe(
      (response) => {
        const successMessage = response?.message || 'Se ha enviado un código de recuperación a tu correo';
        this.toastService.showToast(successMessage, 'success');

        this.email = this.recoveryForm.value.email;
        this.stage = 2; 
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Error al iniciar el proceso de recuperación';
        this.toastService.showToast(errorMessage, 'error');
      }
    );
  }

  moveFocus(index: number, event: any): void {
    const nextInput = event.target.nextElementSibling;
    if (nextInput && event.target.value) {
      nextInput.focus();
    }
  }
  verifyOTP() {
    const otp = Object.values(this.otpForm.value).join('');

    const requestData = {
      email: this.email,
      otp: otp
    };

    this.passwordService.verifyOTP(requestData).subscribe(
      (response) => {
        const successMessage = response?.message || 'Verificación correcta.';
        this.toastService.showToast(successMessage, 'success');

        this.recoveryToken = otp;
        this.stage = 3;
      },
      (error) => {
        const errorMessage = error?.error?.message || 'El código ingresado es incorrecto o ha expirado.';
        this.toastService.showToast(errorMessage, 'error');
      }
    );
  }

  //metodo para reestablecer una contraseña
  resetPassword() {
    if (this.resetForm.invalid || this.resetForm.value.newPassword !== this.resetForm.value.confirmPassword) {
      console.error('Las contraseñas no coinciden o son inválidas');
      return;
    }
    const credentials = {
      email: this.email,
      newPassword: this.resetForm.value.newPassword
    };

    this.passwordService.resetPassword(credentials).subscribe(
      (response) => {
        const successMessage = response?.message || 'Contraseña restablecida exitosamente';
        this.toastService.showToast(successMessage, 'success');

        this.router.navigate(['login']);
        this.recoveryForm.reset();
        this.otpForm.reset();
        this.resetForm.reset();
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Error al restablecer la contraseña.';
        this.toastService.showToast(errorMessage, 'error');
      }
    );
  }
}
