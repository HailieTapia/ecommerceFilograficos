import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { noXSSValidator } from '../../administrator/shared/validators';
import { ToastService } from '../../services/toastService';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  message = '';
  passwordVisible = false; 
  confirmPasswordVisible = false;
  
  constructor(    private toastService: ToastService,private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^(?! )[a-zA-ZáéíóúÁÉÍÓÚñÑäöüÄÖÜ]+(?: [a-zA-ZáéíóúÁÉÍÓÚñÑäöüÄÖÜ]+)*$/), Validators.minLength(3), Validators.maxLength(50), noXSSValidator()]],
      email: ['', [Validators.required, Validators.email, noXSSValidator()]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/), noXSSValidator()]],
      password: ['', [Validators.required, Validators.minLength(8), noXSSValidator()]],
      confirmPassword: ['', [Validators.required]],
      user_type: ['cliente'],
    }, { validator: this.passwordsMatchValidator });
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }
  passwordsMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ mismatch: true });
    } else {
      // Si coinciden, se asegura de que no haya errores
      formGroup.get('confirmPassword')?.setErrors(null);
    }
    return null; // Siempre retorna null
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
