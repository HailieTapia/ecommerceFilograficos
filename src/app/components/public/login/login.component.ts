import { Component, AfterViewInit, OnInit, EventEmitter, Output, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/config';
import { noXSSValidator } from '../../administrator/shared/validators';
import { PasswordToggleComponent } from '../../administrator/shared/password-toggle/password-toggle.component';
import { ToastService } from '../../services/toastService';
import { ModalService } from '../../services/modal.service';

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
  @Output() closed = new EventEmitter<void>();

  constructor(
    private toastService: ToastService,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, noXSSValidator()]],
      password: ['', [Validators.required, Validators.minLength(8), noXSSValidator()]],
      recaptchaToken: ['', [Validators.required, noXSSValidator()]],
    });
  }

  ngOnInit(): void {
    this.clearAuthState();
  }

  ngAfterViewInit() {
    this.loadRecaptcha();
  }

  loadRecaptcha() {
    if ((window as any).grecaptcha) {
      (window as any).grecaptcha.render('recaptcha-container', {
        sitekey: this.siteKey,
        callback: (response: string) => this.onCaptchaResolved(response),
        'expired-callback': () => this.loginForm.patchValue({ recaptchaToken: '' }),
      });
    }
  }

  onCaptchaResolved(token: string) {
    this.loginForm.patchValue({ recaptchaToken: token });
  }

  clearAuthState(): void {
    this.authService.resetAuthState();
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    this.closeModal();
  }

  closeModal() {
    console.log('Cerrando modal de login');
    this.closed.emit();
    this.modalService.showLoginModal(false);
    // Redirigir a la página inicial o a la página anterior
    this.route.queryParams.subscribe(params => {
      const returnUrl = params['returnUrl'] || '/';
      this.authService.getUser().subscribe(user => {
        if (!user) {
          this.router.navigate(['/']);
        } else {
          this.router.navigateByUrl(returnUrl);
        }
      });
    });
  }

  openRegisterModal() {
    console.log('Abriendo modal de registro desde login');
    this.closeModal();
    this.modalService.showRegisterModal(true);
    this.router.navigate(['/register']);
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
          this.closeModal();

          // Manejar redirección según el rol y returnUrl
          this.route.queryParams.subscribe(params => {
            const returnUrl = params['returnUrl'] || '/';
            this.authService.getUser().subscribe(user => {
              if (user?.tipo === 'administrador') {
                this.router.navigate(['/admin-dashboard']);
              } else {
                this.router.navigateByUrl(returnUrl);
              }
            });
          });
        }
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Error al iniciar sesión';
        this.toastService.showToast(errorMessage, 'error');
      }
    );
  }
}