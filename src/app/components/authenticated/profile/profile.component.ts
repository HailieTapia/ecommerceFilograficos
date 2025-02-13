import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  userProfile: any;
  addressForm: FormGroup;
  profileForm: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.addressForm = this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postal_code: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]]
    });

    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Llamar al método del servicio para obtener el perfil
    this.userService.getProfile().subscribe(
      (profile) => {
        this.userProfile = profile;
        console.log('Perfil del usuario:', this.userProfile);
      },
      (error) => {
        console.error('Error al obtener el perfil:', error);
      }
    );
  }

  // Método para actualizar el perfil del usuario
  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.errorMessage = 'Por favor, complete todos los campos correctamente.';
      return;
    }

    this.userService.updateProfile(this.profileForm.value).subscribe(
      (response) => {
        this.successMessage = 'Perfil actualizado exitosamente.';
        console.log('Perfil actualizado:', response);
      },
      (error) => {
        this.errorMessage = 'Error al actualizar el perfil.';
        console.error('Error al actualizar perfil:', error);
      }
    );
  }

  // Método para agregar dirección
  addAddress(): void {
    if (this.addressForm.invalid) {
      this.errorMessage = 'Por favor, complete todos los campos correctamente.';
      return;
    }

    this.userService.addAddress(this.addressForm.value).subscribe(
      (response) => {
        this.successMessage = 'Dirección agregada exitosamente.';
        console.log('Dirección agregada:', response);
      },
      (error) => {
        this.errorMessage = 'Error al agregar la dirección.';
        console.error('Error al agregar dirección:', error);
      }
    );
  }

  // Método para editar dirección
  editAddress(): void {
    this.addressForm.patchValue({
      street: this.userProfile.Addresses[0].street,
      city: this.userProfile.Addresses[0].city,
      state: this.userProfile.Addresses[0].state,
      postal_code: this.userProfile.Addresses[0].postal_code
    });
  }
}

