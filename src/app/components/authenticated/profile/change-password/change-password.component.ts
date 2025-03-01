import { Component } from '@angular/core';
import { PasswordService } from '../../../services/password.service'; // Ajusta la ruta según tu estructura de carpetas
import { FormBuilder, FormGroup,ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private passwordService: PasswordService // Inyecta el servicio
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  onSubmit(): void {
    if (this.changePasswordForm.valid) {
      const formData = this.changePasswordForm.value;

      this.passwordService.changePassword(formData).subscribe(
        response => {
          console.log('Contraseña cambiada exitosamente', response);
          // Aquí puedes manejar la respuesta, por ejemplo, mostrar un mensaje de éxito
        },
        error => {
          console.error('Error al cambiar la contraseña', error);
          // Aquí puedes manejar el error, por ejemplo, mostrar un mensaje de error
        }
      );
    } else {
      console.error('El formulario no es válido');
      // Aquí puedes manejar el caso en que el formulario no sea válido
    }
  }
}