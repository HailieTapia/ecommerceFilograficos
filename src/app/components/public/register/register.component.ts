import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators ,FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { noXSSValidator } from '../../administrator/shared/validators';
import { ToastService } from '../../services/toastService';
import { PasswordComponent } from '../../administrator/shared/password/password.component';
@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [PasswordComponent,CommonModule, ReactiveFormsModule, FormsModule]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  message = '';

  constructor(private toastService: ToastService,private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^(?! )[a-zA-ZáéíóúÁÉÍÓÚñÑäöüÄÖÜ]+(?: [a-zA-ZáéíóúÁÉÍÓÚñÑäöüÄÖÜ]+)*$/), Validators.minLength(3), Validators.maxLength(100), noXSSValidator()]],
      email: ['', [Validators.required, Validators.email, noXSSValidator()]],
      phone: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[0-9+]+$/)]],
      user_type: ['cliente'],
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }
    this.loading = true;
    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        this.toastService.showToast('Registro exitoso, revisa tu correo para verificar la cuenta.', 'success');
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Error al registrar';
        this.toastService.showToast(errorMessage, 'error');
        this.loading = false;
      }
    });
  }
}
