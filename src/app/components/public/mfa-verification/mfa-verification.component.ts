import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mfa-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './mfa-verification.component.html',
  styleUrls: ['./mfa-verification.component.css']
})
export class MfaVerificationComponent implements OnInit {
  mfaForm: FormGroup;
  userId: string | null = null;
  errorMessage: string = '';
  successMessage: string = '';
  isVerified = false; // Bandera para verificar si el código OTP fue validado
  isModalOpen = false; // Controlar la visibilidad del modal

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.mfaForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8)]] // Cambiar a 8 caracteres
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.userId = params['userId'];
      if (this.userId) {
        this.authService.sendOtpMfa(this.userId).subscribe({
          next: () => {
            console.log('OTP enviado correctamente');
            this.openModal(); // Abrir el modal automáticamente al cargar el componente
          },
          error: err => {
            console.error('Error enviando OTP:', err);
            this.errorMessage = 'Error al enviar el código OTP';
          }
        });
      } else {
        this.errorMessage = 'No se encontró el usuario';
      }
    });
  }

  // Abrir el modal
  openModal(): void {
    this.mfaForm.reset(); // Reiniciar el formulario
    this.errorMessage = ''; // Limpiar mensajes de error
    this.successMessage = ''; // Limpiar mensajes de éxito
    this.isVerified = false; // Reiniciar la bandera de verificación
    this.isModalOpen = true; // Mostrar el modal
  }

  // Cerrar el modal y redirigir si no se verificó el código
  closeModal(): void {
    console.log("Cerrando modal...");
    this.isModalOpen = false; // Ocultar el modal

    // Redirigir al login si no se verificó el código
    if (!this.isVerified) {
      console.log("Redirigiendo al login...");
      this.router.navigate(['/login']);
    } else {
      console.log("El código fue verificado, no se redirige al login.");
    }
  }

  // Verificar el código OTP
  verifyOtp(): void {
    if (this.mfaForm.invalid || !this.userId) {
      this.errorMessage = 'Por favor, ingresa un código OTP válido.';
      return;
    }
  
    const otpCode = this.mfaForm.value.otp.trim(); // Asegúrate de eliminar espacios adicionales
    this.authService.verifyMfaOtp(this.userId, otpCode).subscribe({
      next: (response) => {
        console.log('OTP verificado con éxito', response);
        this.successMessage = 'Código OTP verificado correctamente.';
        this.isVerified = true; // Marcar como verificado
  
        // Redirigir según el tipo de usuario
        console.log('LOG antes del if, el tipo es:', response.tipo);
        if (response.tipo === 'administrador') {
          console.log('LOG en el if, el tipo es:', response.tipo);
          this.router.navigate(['/admin-dashboard']); // Redirigir a la página de administrador
        } else if (response.tipo === 'cliente') {
          console.log('LOG en el if, el tipo es:', response.tipo);
          this.router.navigate(['/']); // Redirigir a la página de cliente
        } else {
          console.log('LOG en el else, el tipo es:', response.tipo);
          this.router.navigate(['/login']); // Redirigir a una página por defecto si el tipo no está definido
        }
      },
      error: err => {
        console.error('Error al verificar OTP:', err);
        this.errorMessage = 'Código OTP incorrecto. Inténtalo de nuevo.';
      }
    });
  }
}