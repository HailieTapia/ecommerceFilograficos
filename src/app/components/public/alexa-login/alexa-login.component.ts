import { Component, OnInit, AfterViewInit, EventEmitter, Output, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AlexaAuthService } from '../../services/alexa-auth.service';
import { environment } from '../../../environments/config';
import { noXSSValidator } from '../../administrator/shared/validators';
import { PasswordToggleComponent } from '../../administrator/shared/password-toggle/password-toggle.component';
import { ToastService } from '../../services/toastService';

@Component({
  selector: 'app-alexa-login',
  standalone: true,
  imports: [PasswordToggleComponent, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './alexa-login.component.html',
  styleUrls: ['./alexa-login.component.css']
})
export class AlexaLoginComponent implements OnInit, AfterViewInit {
  loginForm: FormGroup;
  @Output() closed = new EventEmitter<void>();
  private redirectUri: string = '';
  private state: string = '';
  private scopes: string[] = environment.alexaScopes;

  constructor(
    private toastService: ToastService,
    private fb: FormBuilder,
    private authService: AuthService,
    private alexaAuthService: AlexaAuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, noXSSValidator()]],
      password: ['', [Validators.required, Validators.minLength(8), noXSSValidator()]]
    });
  }

  ngOnInit(): void {
    // Obtener parámetros de la URL
    this.route.queryParams.subscribe(params => {
      this.redirectUri = params['redirect_uri'] || '';
      this.state = params['state'] || '';
      const scopeParam = params['scope'] || 'read:orders write:orders'; // Scopes mínimos requeridos
      this.scopes = scopeParam.split(' ').filter((s: string) => environment.alexaScopes.includes(s));
      // Validar redirectUri
      if (!this.alexaAuthService.isValidRedirectUri(this.redirectUri)) {
        this.toastService.showToast('URL de redirección inválida.', 'error');
        this.closeModal();
      }
      // Validar scopes
      if (!this.alexaAuthService.isValidScopes(this.scopes)) {
        this.toastService.showToast('Scopes inválidos.', 'error');
        this.closeModal();
      }
    });
    this.clearAuthState();
  }

  ngAfterViewInit() {
    // No se carga reCAPTCHA para Alexa
  }

  clearAuthState(): void {
    this.authService.resetAuthState();
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    this.closeModal();
  }

  closeModal() {
    this.closed.emit();
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.toastService.showToast('Por favor, completa los campos correctamente.', 'warning');
      return;
    }

    const loginData = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        if (response.mfaRequired) {
          this.toastService.showToast('Se requiere autenticación de dos factores.', 'info');
          this.router.navigate(['/mfa-verification'], {
            queryParams: {
              userId: response.userId,
              redirectUri: this.redirectUri,
              state: this.state,
              scope: this.scopes.join(' ')
            }
          });
        } else {
          // Verificar que el usuario es administrador
          if (response.tipo !== 'administrador') {
            this.toastService.showToast('Solo los administradores pueden autorizar esta skill.', 'error');
            this.authService.logout().subscribe(() => this.closeModal());
            return;
          }
          // Completar la autorización de Alexa
          this.alexaAuthService.completeAuthorization(
            response.userId,
            this.redirectUri,
            this.state,
            this.scopes
          ).subscribe({
            next: (authResponse) => {
              this.toastService.showToast('Autorización de Alexa completada.', 'success');
              window.location.href = authResponse.redirectUrl;
            },
            error: (error) => {
              this.toastService.showToast(error.message || 'Error al completar la autorización.', 'error');
              this.authService.logout().subscribe(() => this.closeModal());
            }
          });
        }
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Error al iniciar sesión';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }
}