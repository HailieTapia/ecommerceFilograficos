import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toastService';

@Component({
  selector: 'app-mfa-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './mfa-verification.component.html',
  styleUrls: ['./mfa-verification.component.css']
})
export class MfaVerificationComponent implements OnInit {
  mfaForm: FormGroup;
  userId: string | null = null;
  errorMessage: string = '';
  successMessage: string = '';
  isVerified = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) {
    this.mfaForm = this.fb.group({
      otp0: ['', [Validators.required]],
      otp1: ['', [Validators.required]],
      otp2: ['', [Validators.required]],
      otp3: ['', [Validators.required]],
      otp4: ['', [Validators.required]],
      otp5: ['', [Validators.required]],
      otp6: ['', [Validators.required]],
      otp7: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.userId = params['userId'];
      if (this.userId) {
        this.authService.sendOtpMfa(this.userId).subscribe({
          next: () => {
            console.log('OTP enviado correctamente');
            this.toastService.showToast('Se ha enviado un código OTP a tu correo.', 'info');
          },
          error: err => {
            console.error('Error enviando OTP:', err);
            this.errorMessage = 'Error al enviar el código OTP';
            this.toastService.showToast(this.errorMessage, 'error');
            this.router.navigate(['/login']);
          }
        });
      } else {
        this.errorMessage = 'No se encontró el usuario';
        this.toastService.showToast(this.errorMessage, 'error');
        this.router.navigate(['/login']);
      }
    });
  }

  moveFocus(index: number, event: any): void {
    const input = event.target;
    const value = input.value.toUpperCase();
    input.value = value;
    this.mfaForm.get(`otp${index}`)?.setValue(value);

    const nextInput = input.nextElementSibling;
    if (nextInput && value) {
      nextInput.focus();
    }
  }

  handleKeyDown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const previousInput = input.previousElementSibling as HTMLInputElement | null;

    if (event.key === 'Backspace' || event.key === 'Delete') {
      const currentValue = input.value;

      if (!currentValue && previousInput) {
        event.preventDefault();
        previousInput.focus();
        previousInput.value = '';
        this.mfaForm.get(`otp${index - 1}`)?.setValue('');
      } else if (currentValue) {
        input.value = '';
        this.mfaForm.get(`otp${index}`)?.setValue('');
      }
    }
  }

  verifyOtp(): void {
    if (this.mfaForm.invalid || !this.userId) {
      this.errorMessage = 'Por favor, ingresa un código OTP válido.';
      this.toastService.showToast(this.errorMessage, 'warning');
      return;
    }

    const otp = Object.values(this.mfaForm.value).join('');
    this.authService.verifyMfaOtp(this.userId, otp).subscribe({
      next: (response) => {
        console.log('OTP verificado con éxito', response);
        this.successMessage = 'Código OTP verificado correctamente.';
        this.isVerified = true;
        this.toastService.showToast(this.successMessage, 'success');

        if (response.tipo === 'administrador') {
          this.router.navigate(['/admin-dashboard']);
        } else if (response.tipo === 'cliente') {
          this.router.navigate(['/']);
        } else {
          this.router.navigate(['/login']);
        }
      },
      error: err => {
        console.error('Error al verificar OTP:', err);
        const attemptsRemaining = err.error?.attemptsRemaining;
        if (err.status === 400 && typeof attemptsRemaining === 'number') {
          if (attemptsRemaining > 0) {
            this.errorMessage = `Código incorrecto. Te quedan ${attemptsRemaining} intentos.`;
            this.toastService.showToast(this.errorMessage, 'error');
          } else {
            this.errorMessage = 'Código incorrecto. Se han agotado los intentos.';
            this.toastService.showToast('Código incorrecto. Regresando al inicio de sesión.', 'error');
            this.router.navigate(['/login']);
          }
        } else {
          this.errorMessage = 'Error al verificar el código. Intenta de nuevo más tarde.';
          this.toastService.showToast('Error al verificar el código. Regresando al inicio de sesión.', 'error');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  cancelVerification(): void {
    this.toastService.showToast('Verificación cancelada. Regresando al inicio de sesión.', 'info');
    this.router.navigate(['/login']);
  }
}