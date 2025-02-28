import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { ToastService } from '../../../services/toastService';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule,],
  templateUrl: './personal-info.component.html',
  styleUrl: './personal-info.component.css'
})
export class PersonalInfoComponent {
  @Input() userProfile: any = {};
  profileForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private toastService: ToastService,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', Validators.required],
    });
  }

  ngOnChanges(): void {
    if (this.userProfile) {
      this.profileForm.patchValue({
        name: this.userProfile.name,
        phone: this.userProfile.phone,
      });
    }
  }

  // Método para actualizar el perfil del usuario
  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.errorMessage = 'Por favor, complete todos los campos correctamente.';
      return;
    }

    this.userService.updateProfile(this.profileForm.value).subscribe(
      (response) => {
        const successMessage = response?.message || 'Perfil actualizado exitosamente.';
        this.toastService.showToast(successMessage, 'success');
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Error al actualizar el perfil';
        this.toastService.showToast(errorMessage, 'error');
      }
    );
  }
}