import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../../services/toastService';
import { ModalComponent } from '../../../../modal/modal.component';
import * as addressData from '../../../administrator/shared/direccion.json';
@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [ModalComponent, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './addresses.component.html',
  styleUrl: './addresses.component.css'
})
export class AddressesComponent implements OnInit {
  @ViewChild('modal') modal!: ModalComponent;
  userProfile: any = {};
  addressForm: FormGroup;
  address: any = addressData;

  constructor(
    private toastService: ToastService,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.addressForm = this.fb.group({
      street: ['', [Validators.required, Validators.maxLength(100),Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ.,-]+$/)]],
      city: ['',Validators.required],
      state: ['',Validators.required],
      postal_code: ['',Validators.required],
    });
  }

  ngOnInit(): void {
    this.getUserInfo();
  }

  ngAfterViewInit(): void {
    if (!this.modal) {
      console.error('El modal no está inicializado correctamente.');
    }
  }

  openCreateModal(): void {
    this.addressForm.reset();
    this.modal.open();
  }

  getUserInfo(): void {
    this.userService.getProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
      },
      error: (error) => {
        this.toastService.showToast(error?.error?.message || 'Error al obtener el perfil', 'error');
      },
    });
  }

  openEditModal(): void {
    this.userService.getProfile().subscribe({
      next: (response) => {
        if (response.Addresses && response.Addresses.length > 0) {
          const address = response.Addresses[0]; // Usamos la primera dirección AJUSTES DE BACKEND SI SE NECESITARA LAS DIRECCIOENS
          this.addressForm.patchValue({
            street: address.street,
            city: address.city,
            state: address.state,
            postal_code: address.postal_code,
          });
          this.modal.open();
        } else {
          this.toastService.showToast('No hay dirección para editar', 'error');
        }
      },
      error: (err) => {
        console.error('Error al obtener la dirección:', err);
        this.toastService.showToast('Error al cargar la dirección', 'error');
      },
    });
  }
  savePerfil(): void {
    if (this.addressForm.invalid) {
      this.toastService.showToast('Formulario inválido. Revisa los campos.', 'error');
      return;
    }

    const addressData = this.addressForm.value;

    if (this.userProfile.Addresses && this.userProfile.Addresses.length > 0) {
      this.userService.updateUserProfile(addressData).subscribe({
        next: () => {
          console.log(addressData);
          this.toastService.showToast('Dirección actualizada exitosamente', 'success');
          this.getUserInfo();
          this.modal.close();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al actualizar la dirección';
          this.toastService.showToast(errorMessage, 'error');
        },
      });
    } else {
      this.userService.addAddress(addressData).subscribe({
        next: () => {
          console.log(addressData);
          this.toastService.showToast('Dirección creada exitosamente', 'success');
          this.getUserInfo();
          this.modal.close();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al crear la dirección';
          this.toastService.showToast(errorMessage, 'error');
        },
      });
    }
  }
}