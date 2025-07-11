import { Component, OnInit, AfterViewInit, EventEmitter, Output, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  isLoading = false;
  private redirectUri: string = '';
  private state: string = '';
  private clientId: string = '';
  private responseType: string = '';
  private scopes: string[] = [];

  constructor(
    private toastService: ToastService,
    private fb: FormBuilder,
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
    this.route.queryParams.subscribe(params => {
      this.redirectUri = params['redirect_uri'] || '';
      this.state = params['state'] || '';
      this.clientId = params['client_id'] || '';
      this.responseType = params['response_type'] || '';
      const scopeParam = params['scope'] || 'read:orders write:orders';
      this.scopes = scopeParam.split(' ').filter((s: string) => s.trim() !== '');

      if (!this.validateParameters()) {
        this.closeModal();
      }
    });
  }

  ngAfterViewInit() {
    // No reCAPTCHA for Alexa login
  }

  private validateParameters(): boolean {
    if (!this.clientId || this.clientId !== environment.clientId) {
      this.toastService.showToast('Client ID inválido.', 'error');
      return false;
    }

    if (!this.responseType || this.responseType !== 'code') {
      this.toastService.showToast('Response type inválido.', 'error');
      return false;
    }

    if (!this.state) {
      this.toastService.showToast('Estado requerido.', 'error');
      return false;
    }

    if (!this.redirectUri || !this.alexaAuthService.isValidRedirectUri(this.redirectUri)) {
      this.toastService.showToast('URL de redirección inválida.', 'error');
      console.error('Redirect URI inválido:', this.redirectUri);
      console.error('URLs válidas:', environment.alexaRedirectUrls);
      return false;
    }

    if (!this.scopes.length || !this.alexaAuthService.isValidScopes(this.scopes)) {
      this.toastService.showToast('Scopes inválidos.', 'error');
      console.error('Scopes inválidos:', this.scopes);
      console.error('Scopes válidos:', environment.alexaScopes);
      return false;
    }

    return true;
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    this.closeModal();
  }

  closeModal() {
    this.closed.emit();
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
      password: this.loginForm.value.password,
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: this.state,
      scope: this.scopes.join(' ')
    };

    this.alexaAuthService.login(loginData).subscribe({
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
        const errorMessage = error?.error?.message || 'Error al iniciar sesión para Alexa';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  private handleSuccessfulLogin(response: any) {
    this.isLoading = false;
    this.toastService.showToast('Inicio de sesión para Alexa exitoso.', 'success');
    if (response.redirectUrl) {
      window.location.href = response.redirectUrl;
    } else {
      this.toastService.showToast('Error: No se recibió URL de redirección.', 'error');
      this.closeModal();
    }
  }
}