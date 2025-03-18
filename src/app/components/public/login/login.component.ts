import { Component, AfterViewInit, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/config';
import { noXSSValidator } from '../../administrator/shared/validators';
import { PasswordToggleComponent } from '../../administrator/shared/password-toggle/password-toggle.component';
import { ToastService } from '../../services/toastService';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [PasswordToggleComponent, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit {
  loginForm: FormGroup;
  siteKey = environment.recaptchaSiteKey;

  constructor(
    private toastService: ToastService,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, noXSSValidator()]],
      password: ['', [Validators.required, Validators.minLength(8), noXSSValidator()]],
      recaptchaToken: ['', [Validators.required, noXSSValidator()]],
    });
  }

  // Limpiar el estado de autenticación al cargar el componente
  ngOnInit(): void {
    this.clearAuthState();
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

  // Limpiar el estado de autenticación
  clearAuthState(): void {
    this.authService.resetAuthState(); 
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.toastService.showToast('Por favor, completa los campos correctamente.', 'warning');
      return;
    }

    this.authService.login(this.loginForm.value).subscribe(
      (response) => {
        if (response.mfaRequired) {
          this.toastService.showToast('Se requiere autenticación de dos factores.', 'info');
          this.router.navigate(['/mfa-verification'], {
            queryParams: { userId: response.userId }
          });
        } else {
          this.toastService.showToast('Inicio de sesión exitoso.', 'success');
          this.loginForm.reset();
          this.router.navigate(['/']);
        }
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Error al iniciar sesión';
        this.toastService.showToast(errorMessage, 'error');
      }
    );
  }
}
