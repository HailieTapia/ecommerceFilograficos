import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { noXSSValidator } from '../../administrator/shared/validators';

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
  passwordVisible = false; // Para controlar la visibilidad de la contraseña
  confirmPasswordVisible = false; // Para controlar la visibilidad de la confirmación de la contraseña

  
  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^(?! )[a-zA-ZáéíóúÁÉÍÓÚñÑäöüÄÖÜ]+(?: [a-zA-ZáéíóúÁÉÍÓÚñÑäöüÄÖÜ]+)*$/), Validators.minLength(3), Validators.maxLength(50), noXSSValidator()]],
      email: ['', [Validators.required, Validators.email, noXSSValidator()]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/), noXSSValidator()]],
      password: ['', [Validators.required, Validators.minLength(8), noXSSValidator()]],
      confirmPassword: ['', [Validators.required]],
      user_type: ['cliente'],
    }, { validator: this.passwordsMatchValidator });
  }
  // Método para alternar la visibilidad de la contraseña
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  // Método para alternar la visibilidad de la confirmación de la contraseña
  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }
  passwordsMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      // Si las contraseñas no coinciden, se establece el error
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
        this.message = response.message;
        this.loading = false;
        alert('Registro exitoso, revisa tu correo para verificar la cuenta.');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.message = error.error.message || 'Error en el registro';
        this.loading = false;
      }
    });
  }
}
