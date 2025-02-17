import { Component, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
  loginForm: FormGroup;
  loading = false;
  message = '';
  siteKey = environment.recaptchaSiteKey;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      recaptchaToken: ['', Validators.required],
    });
  }

  // Inicializar reCAPTCHA cuando la vista esté lista
  ngAfterViewInit() {
    this.loadRecaptcha();
  }

  // Función para cargar reCAPTCHA
  loadRecaptcha() {
    if ((window as any).grecaptcha) {
      (window as any).grecaptcha.render('recaptcha-container', {
        sitekey: this.siteKey,
        callback: (response: string) => this.onCaptchaResolved(response),
        'expired-callback': () => this.loginForm.patchValue({ recaptchaToken: '' }),
      });
    }
  }

  // Almacenar el token del reCAPTCHA
  onCaptchaResolved(token: string) {
    this.loginForm.patchValue({ recaptchaToken: token });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.message = ''; // Limpiar mensajes anteriores

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading = false;

        if (response.mfaRequired) {
          // Redirigir a la verificación de MFA con el userId como parámetro de consulta
          this.router.navigate(['/mfa-verification'], {
            queryParams: { userId: response.userId }
          });
        } else {
          // Inicio de sesión exitoso sin MFA
          this.message = response.message;
          this.loginForm.reset(); // Limpiar el formulario
          this.router.navigate(['/profile']); // Redirigir al perfil
        }
      },
      error: (error) => {
        this.loading = false;

        if (error.error?.message) {
          console.log('Mensaje de error del backend:', error.error.message);
          this.message = error.error.message;
        } else {
          console.log('Error desconocido');
          this.message = 'Error en el inicio de sesión. Intenta de nuevo.';
        }
      }
    });
  }
}