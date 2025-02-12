import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule ,FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule ,ReactiveFormsModule, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})

export class ProfileComponent implements OnInit {

  userProfile: any;
  addressData: any = { 
    street: '',
    city: '',
    state: '',
    postal_code: ''
  };

  successMessage: string = '';
  errorMessage: string = '';

  constructor(private userService: UserService) { }  // Inyectar el servicio

  ngOnInit(): void {
    // Llamar al método del servicio para obtener el perfil
    this.userService.getProfile().subscribe(
      (profile) => {
        this.userProfile = profile;
        console.log('Perfil del usuario:', this.userProfile); // Imprimir el perfil en consola

        // Si el usuario ya tiene una dirección, pre-poblar los campos
        if (this.userProfile.Addresses && this.userProfile.Addresses.length > 0) {
          const address = this.userProfile.Addresses[0];
          this.addressData = {
            street: address.street,
            city: address.city,
            state: address.state,
            postal_code: address.postal_code
          };
        }
      },
      (error) => {
        console.error('Error al obtener el perfil:', error);
      }
    );
  }
  // Método para agregar dirección
  addAddress(): void {
    this.userService.addAddress(this.addressData).subscribe(
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
}