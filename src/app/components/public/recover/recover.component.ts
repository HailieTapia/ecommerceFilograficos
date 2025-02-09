import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/password.service';
import {ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recover',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './recover.component.html',
  styleUrl: './recover.component.css'
})
export class RecoverComponent {
  recoveryForm: FormGroup;
  otpForm: FormGroup;
  resetForm: FormGroup;
  stage: number = 1; 
  email: string ="";
  recoveryToken: string = "";

  constructor(private fb: FormBuilder, private authService: AuthService) {
    // Formulario para iniciar la recuperación de contraseña
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Formulario para verificar OTP
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Formulario para restablecer la contraseña
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  // Iniciar la recuperación de contraseña
  initiateRecovery() {
    if (this.recoveryForm.invalid) {
      console.error('Por favor ingresa un correo válido');
      return;
    }
    this.authService.recover(this.recoveryForm.value).subscribe(
      (response) => {
        console.error('Se ha enviado un código de recuperación a tu correo');
        this.email = this.recoveryForm.value.email;
        this.stage = 2; // Pasar a la siguiente etapa (verificación OTP)
      },
      (error) => {
        console.error('Error al iniciar el proceso de recuperación');
      }
    );
  }

  // Verificar el código OTP
  verifyOTP() {
    if (this.otpForm.invalid) {
      console.error('Por favor ingresa un código OTP válido');
      return;
    }
    this.authService.verify({ email: this.email, otp: this.otpForm.value.otp }).subscribe(
      (response) => {
        console.error('OTP verificado correctamente');
        this.recoveryToken = this.otpForm.value.otp;
        this.stage = 3; // Pasar a la siguiente etapa (restablecer contraseña)
      },
      (error) => {
        console.error('Código OTP incorrecto o expirado');
      }
    );
  }

  // Restablecer la contraseña
  resetPassword() {
    if (this.resetForm.invalid || this.resetForm.value.newPassword !== this.resetForm.value.confirmPassword) {
      console.error('Las contraseñas no coinciden o son inválidas');
      return;
    }
    const credentials = {
      email: this.email,
      newPassword: this.resetForm.value.newPassword
    };

    this.authService.resets(credentials).subscribe(
      (response) => {
        console.error('Contraseña restablecida exitosamente');
        this.stage = 1; // Volver al inicio del proceso
        this.recoveryForm.reset();
        this.otpForm.reset();
        this.resetForm.reset();
      },
      (error) => {
        console.error('Error al restablecer la contraseña');
      }
    );
  }
}
