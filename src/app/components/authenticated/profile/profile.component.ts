import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms'; 
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})

export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  addressForm!: FormGroup;
  loading = false;
  
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadProfile();
  }

  private initForms(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      phone: ['', [Validators.required]]
    });

    this.addressForm = this.fb.group({
      street: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postal_code: ['', [Validators.required]]
    });
  }

  private loadProfile(): void {
    this.loading = true;
    this.userService.getProfile().subscribe({
      next: (data) => {
        this.profileForm.patchValue({
          name: data.name,
          phone: data.phone
        });

        if (data.Address) {
          this.addressForm.patchValue(data.Address);
        }

        this.loading = false;
      },
      error: () => {
        console.error('Error al cargar el perfil.');
        this.loading = false;
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      console.error('Por favor, completa los campos obligatorios.');
      return;
    }

    this.loading = true;
    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        console.error('Perfil actualizado correctamente.');
        this.loading = false;
      },
      error: () => {
        console.error('Error al actualizar el perfil.');
        this.loading = false;
      }
    });
  }

  updateAddress(): void {
    if (this.addressForm.invalid) {
      console.error('Todos los campos de la dirección son obligatorios.');
      return;
    }

    this.loading = true;
    this.userService.updateUserProfile(this.addressForm.value).subscribe({
      next: () => {
        console.error('Dirección actualizada correctamente.');
        this.loading = false;
      },
      error: () => {
        console.error('Error al actualizar la dirección.');
        this.loading = false;
      }
    });
  }
}
