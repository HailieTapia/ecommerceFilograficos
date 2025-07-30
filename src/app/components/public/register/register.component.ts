import { Component, EventEmitter, Output, HostListener, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { noXSSValidator } from '../../administrator/shared/validators';
import { ToastService } from '../../../services/toastService';
import { PasswordComponent } from '../../administrator/shared/password/password.component';
import { ModalService } from '../../../services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [PasswordComponent, CommonModule, ReactiveFormsModule, FormsModule]
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  loading = false;
  message = '';
  showModal = false;
  termsAccepted = false; // Nueva variable para controlar el checkbox
  @Output() closed = new EventEmitter<void>();
  private modalSubscription!: Subscription;

  constructor(
    private toastService: ToastService,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private modalService: ModalService
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^(?! )[a-zA-ZáéíóúÁÉÍÓÚñÑäöüÄÖÜ]+(?: [a-zA-ZáéíóúÁÉÍÓÚñÑäöüÄÖÜ]+)*$/), Validators.minLength(3), Validators.maxLength(100), noXSSValidator()]],
      email: ['', [Validators.required, Validators.email, noXSSValidator()]],
      phone: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[0-9+]+$/)]],
      user_type: ['cliente'],
    });
  }

  ngOnInit(): void {
    this.modalSubscription = this.modalService.showRegisterModal$.subscribe(show => {
      this.showModal = show;
      if (!show && this.router.url.startsWith('/register')) {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.modalSubscription) {
      this.modalSubscription.unsubscribe();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    event.preventDefault();
    this.closeModal();
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
        this.closeModal();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Error al registrar';
        this.toastService.showToast(errorMessage, 'error');
        this.loading = false;
      }
    });
  }

  closeModal() {
    this.closed.emit();
    this.modalService.showRegisterModal(false);
    if (this.router.url.startsWith('/register')) {
      this.router.navigate(['/']);
    }
  }

  openLoginModal() {
    this.closeModal();
    this.modalService.showLoginModal(true);
    this.router.navigate(['/login']);
  }
  
  openTermsAndConditions() {
    // Abre en nueva pestaña
    window.open('/legal?document=T%C3%A9rminos%20y%20Condiciones', '_blank');
  }
}