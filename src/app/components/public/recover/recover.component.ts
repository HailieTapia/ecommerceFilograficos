import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PasswordService } from '../../services/password.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recover',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './recover.component.html',
  styleUrl: './recover.component.css'
})
export class RecoverComponent {
  recoveryForm: FormGroup;
  otpForm: FormGroup;
  resetForm: FormGroup;
  stage: number = 1;
  email: string = "";
  recoveryToken: string = "";

  constructor(private fb: FormBuilder, private passwordService: PasswordService) {
    // Formulario para iniciar la recuperación de contraseña
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Formulario para verificar OTP
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required]]
    });

    // Formulario para restablecer la contraseña
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
  }


  // Método para iniciar el proceso de recuperación de contraseña
  initiateRecovery() {
    if (this.recoveryForm.invalid) {
      console.error('Por favor ingresa un correo válido');
      return;
    }
    this.passwordService.initiatePasswordRecovery(this.recoveryForm.value).subscribe(
      (response) => {
        console.log('Se ha enviado un código de recuperación a tu correo');
        this.email = this.recoveryForm.value.email;
        this.stage = 2; // Pasar a la siguiente etapa (verificación OTP)
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Error al iniciar el proceso de recuperación';
        console.error('MENSAJE DE MI BACK.', errorMessage);
      }
    );
  }


  //metodo para verificar el codigo otp para recuperacion de contraseña(NO)
  verifyOTP() {
    if (this.otpForm.invalid) {
      console.error('Por favor ingresa un código OTP válido');
      return;
    }

    const requestData = {
      email: this.email,
      otp: this.otpForm.value.otp
    };

    console.log('Enviando datos para verificar OTP:', requestData);

    this.passwordService.verifyOTP(requestData).subscribe(
      (response) => {
        console.log('Respuesta del backend:', response);
        console.log('OTP verificado correctamente');
        this.recoveryToken = this.otpForm.value.otp;
        this.stage = 3; // Pasar a la siguiente etapa (restablecer contraseña)
      },
      (error) => {
        const errorMessage = error?.error?.message || 'El OTP ingresado es incorrecto o ha expirado.';
        console.error('MENSAJE DE MI BACK.', errorMessage);
      }
    );
  }

  //metodo para reestablecer una contraseña(NO)
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
