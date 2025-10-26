import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../services/user.service';
import { ToastService } from '../../../../services/toastService';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Interfaz para tipar Badge
interface Badge {
  id: number;
  name: string;
  icon_url: string;
  description: string;
  category: string;
  obtained_at: string;
  product_category: string | null; // Added product_category
}

// Interfaz para tipar userProfile
interface UserProfile {
  name?: string;
  phone?: string;
  email?: string;
  Addresses?: any[];
  badges?: Badge[];
}

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './personal-info.component.html',
  styleUrl: './personal-info.component.css'
})
export class PersonalInfoComponent implements OnChanges {
  @Input() userProfile: UserProfile = {};
  @Output() profileUpdated = new EventEmitter<UserProfile>();
  profileForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private toastService: ToastService,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        Validators.pattern(/^(?! )[a-zA-ZáéíóúÁÉÍÓÚñÑäöüÄÖÜ]+(?: [a-zA-ZáéíóúÁÉÍÓÚñÑäöüÄÖÜ]+)*$/)
      ]],
      phone: ['', [
        Validators.required,
        Validators.maxLength(10),
        Validators.pattern(/^[0-9+]+$/)
      ]]
    });
  }

  ngOnChanges(): void {
    if (this.userProfile) {
      this.profileForm.patchValue({
        name: this.userProfile.name || '',
        phone: this.userProfile.phone || ''
      });
    }
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.errorMessage = 'Por favor, complete todos los campos correctamente.';
      this.profileForm.markAllAsTouched();
      return;
    }

    // Enviar solo los campos modificados
    const formData: Partial<UserProfile> = {};
    const formName = this.profileForm.get('name')?.value;
    const formPhone = this.profileForm.get('phone')?.value;

    if (formName !== (this.userProfile.name || '')) {
      formData.name = formName;
    }
    if (formPhone !== (this.userProfile.phone || '')) {
      formData.phone = formPhone;
    }

    if (Object.keys(formData).length === 0) {
      this.toastService.showToast('No se realizaron cambios en el perfil.', 'info');
      return;
    }

    this.userService.updateProfile(formData).subscribe(
      (response) => {
        this.profileUpdated.emit(response.user);
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Error al actualizar el perfil';
        this.toastService.showToast(errorMessage, 'error');
      }
    );
  }
}