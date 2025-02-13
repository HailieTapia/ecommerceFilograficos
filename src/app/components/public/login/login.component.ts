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
  styleUrl: './login.component.css'
})
export class LoginComponent implements AfterViewInit {
  loginForm: FormGroup;
  loading = false;
  message = '';
  siteKey = environment.recaptchaSiteKey;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
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
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.message = response.message;
        this.loading = false;
        alert('Te has logeado');
        this.router.navigate(['/profile']);
      },
      error: (error) => {
        this.loading = false;
  
        // Si el error tiene un mensaje, imprímelo directamente
        if (error.error?.message) {
          console.log('Mensaje de error del backend:', error.error.message);
          this.message = error.error.message; // Asignar el mensaje para mostrarlo en el frontend
        } else {
          // Si no hay mensaje, muestra un error genérico
          console.log('error desconocidooooooooooo');
          this.message = 'Error en el inicio de sesión. Intenta de nuevo.';
        }
      }
    });
  }
}