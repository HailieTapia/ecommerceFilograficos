import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastComponent } from '../../../administrator/shared/toast/toast.component';
import { ToastService } from '../../../services/toastService';
import { ModalComponent } from '../../../../modal/modal.component';
@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [ModalComponent,ToastComponent,CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './addresses.component.html',
  styleUrl: './addresses.component.css'
})
export class AddressesComponent  implements OnInit {
    userProfile: any = {};
    addressForm: FormGroup;
    successMessage: string = '';
    errorMessage: string = '';

    addAddressId: number | null = null;
  
    constructor(
      private toastService: ToastService,
      private userService: UserService,
      private fb: FormBuilder
    ) {
      this.addressForm = this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        postal_code: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]]
      });
    }
  
    ngOnInit(): void {
      this.getUserInfo();
    }
    // Obtener la información de la empresa
    getUserInfo(): void {
      this.userService.getProfile().subscribe(
        (profile) => {
          this.userProfile = profile;
        },
        (error) => {
          const errorMessage = error?.error?.message || 'Error al obtener el perfil';
          this.toastService.showToast(errorMessage, 'error');
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
          const successMessage = response?.message || 'Dirección agregada exitosamente.';
          this.toastService.showToast(successMessage, 'success');
          this.modal.close();  // Cerrar el modal después de agregar
          this.getUserInfo();
        },
        (error) => {
          const errorMessage = error?.error?.message || 'Error al agregar la dirección.';
          this.toastService.showToast(errorMessage, 'error');
        }
      );
    }
  
    // Método para actualizar dirección
    updateAddress(): void {
      if (this.addressForm.invalid) {
        this.errorMessage = 'Por favor, complete todos los campos correctamente.';
        return;
      }
  
      // Empaquetamos la dirección dentro de un objeto 'direccion' como se espera en el servicio
      const direccion = this.addressForm.value;
  
      this.userService.updateUserProfile(direccion).subscribe(
        (response) => {
          const successMessage = response?.message || 'Dirección actualizada exitosamente.';
          this.toastService.showToast(successMessage, 'success');
          this.modal.close();  // Cerrar el modal después de actualizar
          this.getUserInfo();
        },
        (error) => {
          const errorMessage = error?.error?.message || 'Error al actualizar la dirección.';
          this.toastService.showToast(errorMessage, 'error');
        }
      );
    }
  
    // Método para editar dirección (cuando se selecciona una dirección para actualizar)
    editAddress(address: any): void {
      this.addressForm.patchValue({
        street: address.street,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code
      });
      this.addAddressId = address.id;  // Si usas un id para diferenciar la dirección
    }
    //MODAL
    @ViewChild('modal') modal!: ModalComponent;
    openModal(address?: any): void {
      this.addressForm.reset();
      this.successMessage = '';
      this.errorMessage = '';
    
      if (address) {
        this.addAddressId = address.id;  // Asigna el ID de la dirección al valor de addAddressId
        this.editAddress(address);  // Cargar la dirección para editar
      } else {
        this.addAddressId = null;  // Si es nueva, no hay ID, por lo que debería mostrar "Agregar"
      }
    
      this.modal.open();
    }
  }