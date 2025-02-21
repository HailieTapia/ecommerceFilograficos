import { Component, EventEmitter, Output, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
@Component({
  selector: 'app-password-toggle',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './password-toggle.component.html',
  styleUrl: './password-toggle.component.css'
})
export class PasswordToggleComponent {
  @Input() placeholder: string = 'Ingresa tu contraseña'; // Placeholder personalizable
  @Input() control: any; // Control del formulario (opcional)
  @Output() passwordVisibilityToggled = new EventEmitter<boolean>(); // Emite el estado de visibilidad

  showPassword = false; // Controla si la contraseña es visible o no

  // Función para alternar la visibilidad de la contraseña
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.passwordVisibilityToggled.emit(this.showPassword); // Emite el estado actual
  }
}