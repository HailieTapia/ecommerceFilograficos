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
  private clientId: string = '';
  private responseType: string = '';
  private scopes: string[] = [];
  private isLoading = false;

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
    // Obtener y validar todos los parámetros de la URL
    this.route.queryParams.subscribe(params => {
      this.redirectUri = params['redirect_uri'] || '';
      this.state = params['state'] || '';
      this.clientId = params['client_id'] || '';
      this.responseType = params['response_type'] || '';
      
      // Procesar scopes
      const scopeParam = params['scope'] || 'read:orders write:orders';
      this.scopes = scopeParam.split(' ').filter((s: string) => s.trim() !== '');
      
      // Validaciones
      if (!this.validateParameters()) {
        this.closeModal();
        return;
      }
    });
    
    this.clearAuthState();
  }

  ngAfterViewInit() {
    // No se carga reCAPTCHA para Alexa
  }

  private validateParameters(): boolean {
    // Validar client_id
    if (!this.clientId || this.clientId !== environment.clientId) {
      this.toastService.showToast('Client ID inválido.', 'error');
      return false;
    }

    // Validar response_type
    if (!this.responseType || this.responseType !== 'code') {
      this.toastService.showToast('Response type inválido.', 'error');
      return false;
    }

    // Validar state
    if (!this.state) {
      this.toastService.showToast('Estado requerido.', 'error');
      return false;
    }

    // Validar redirectUri
    if (!this.redirectUri || !this.alexaAuthService.isValidRedirectUri(this.redirectUri)) {
      this.toastService.showToast('URL de redirección inválida.', 'error');
      console.error('Redirect URI inválido:', this.redirectUri);
      console.error('URLs válidas:', environment.alexaRedirectUrls);
      return false;
    }

    // Validar scopes
    if (!this.scopes.length || !this.alexaAuthService.isValidScopes(this.scopes)) {
      this.toastService.showToast('Scopes inválidos.', 'error');
      console.error('Scopes inválidos:', this.scopes);
      console.error('Scopes válidos:', environment.alexaScopes);
      return false;
    }

    return true;
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
    // Redirigir de vuelta a Alexa con error
    if (this.redirectUri && this.state) {
      const errorUrl = `${this.redirectUri}?error=access_denied&state=${this.state}`;
      window.location.href = errorUrl;
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.toastService.showToast('Por favor, completa los campos correctamente.', 'warning');
      return;
    }

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
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
              scope: this.scopes.join(' '),
              isAlexa: 'true'
            }
          });
        } else {
          this.handleSuccessfulLogin(response);
        }
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error?.error?.message || 'Error al iniciar sesión';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  private handleSuccessfulLogin(response: any) {
    // Verificar que el usuario es administrador
    if (response.tipo !== 'administrador') {
      this.toastService.showToast('Solo los administradores pueden autorizar esta skill.', 'error');
      this.authService.logout().subscribe(() => {
        this.isLoading = false;
        this.closeModal();
      });
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
        this.isLoading = false;
        this.toastService.showToast('Autorización de Alexa completada exitosamente.', 'success');
        
        // Redirigir a Alexa con el código de autorización
        if (authResponse.redirectUrl) {
          window.location.href = authResponse.redirectUrl;
        } else {
          this.toastService.showToast('Error: No se recibió URL de redirección.', 'error');
          this.closeModal();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al completar autorización:', error);
        this.toastService.showToast(error.message || 'Error al completar la autorización.', 'error');
        this.authService.logout().subscribe(() => this.closeModal());
      }
    });
  }
}