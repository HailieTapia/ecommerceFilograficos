import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlexaAuthService } from '../../services/alexa-auth.service';
import { ToastService } from '../../services/toastService';
import { PasswordToggleComponent } from '../../administrator/shared/password-toggle/password-toggle.component';
import { noXSSValidator } from '../../administrator/shared/validators';
import { environment } from '../../../environments/config';

@Component({
  selector: 'app-alexa-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PasswordToggleComponent],
  templateUrl: './alexa-login.component.html',
  styleUrls: ['./alexa-login.component.css']
})
export class AlexaLoginComponent implements OnInit {
  loginForm: FormGroup;
  private alexaRedirectUrl = environment.alexaRedirectUrls[0]; // Usa la primera URL de redirección
  isSubmitting = false;

  constructor(
    private toastService: ToastService,
    private fb: FormBuilder,
    private alexaAuthService: AlexaAuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, noXSSValidator()]],
      password: ['', [Validators.required, Validators.minLength(8), noXSSValidator()]]
    });
  }

  ngOnInit(): void {}

  onSubmit() {
    if (this.loginForm.invalid) {
      this.toastService.showToast('Por favor, completa los campos correctamente.', 'warning');
      return;
    }

    if (this.isSubmitting) {
      return; // Evitar envíos múltiples
    }

    this.isSubmitting = true;
    const { email, password } = this.loginForm.value;

    this.alexaAuthService.login(email, password, this.alexaRedirectUrl).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.toastService.showToast('Inicio de sesión exitoso. Redirigiendo a Alexa...', 'success');

        // Construir la URL de redirección con el token como fragmento
        const { access_token, token_type, expires_in, redirect_uri } = response;
        const redirectUrl = `${redirect_uri}#access_token=${access_token}&token_type=${token_type}&expires_in=${expires_in}`;

        console.log('Respuesta del backend:', response);
        console.log('Redirigiendo a:', redirectUrl);

        // Redirigir al navegador
        window.location.assign(redirectUrl);

        // Opcional: No resetear el formulario inmediatamente, ya que la redirección debería ocurrir
      },
      error: (error) => {
        this.isSubmitting = false;
        const errorMessage = error.message || 'Error al iniciar sesión para Alexa';
        this.toastService.showToast(errorMessage, 'error');
        this.loginForm.reset();
      }
    });
  }
}