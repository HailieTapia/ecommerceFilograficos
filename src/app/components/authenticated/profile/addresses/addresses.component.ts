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
  styleUrls: ['./addresses.component.css']
})
export class AddressesComponent implements OnInit {
  @ViewChild('modal') modal!: ModalComponent;
  userProfile: any = {};
  addressForm: FormGroup;
  addressData: any[] = (addressData as any).default || addressData;
  uniquePostalCodes: string[] = [];
  filteredAsentamientos: string[] = [];

  constructor(
    private toastService: ToastService,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.addressForm = this.fb.group({
      street: ['', [Validators.required, Validators.maxLength(255), Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ.,-]+$/)]],
      asentamiento: ['', Validators.required],
      postal_code: ['', Validators.required],
      city: [{ value: 'Pachuca', disabled: true }],
      state: [{ value: 'Hidalgo', disabled: true }]
    });
    this.uniquePostalCodes = [...new Set(this.addressData
      .filter(item => item.estado === 'Hidalgo' && item.municipio === 'Pachuca de Soto')
      .map(item => item.cp.toString()))];
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
    this.addressForm.reset({ city: 'Pachuca', state: 'Hidalgo' });
    this.filteredAsentamientos = [];
    this.modal.open();
  }

  openEditModal(): void {
    this.userService.getProfile().subscribe({
      next: (response) => {
        if (response.address) {
          const address = response.address;
          const streetParts = address.street.split(', ');
          const street = streetParts[0] || '';
          const asentamiento = streetParts[1] || ''; // Extrae el asentamiento
          const postalCode = address.postal_code;

          // Filtrar asentamientos antes de patchValue
          this.filterAsentamientos(postalCode);
          
          // Rellenar el formulario
          this.addressForm.patchValue({
            street,
            asentamiento, // Asigna el asentamiento parseado
            postal_code: postalCode,
            city: 'Pachuca',
            state: 'Hidalgo'
          });
          this.modal.open();
        } else {
          this.toastService.showToast('No hay dirección para editar', 'error');
        }
      },
      error: (err) => {
        console.error('Error al obtener la dirección:', err);
        this.toastService.showToast('Error al cargar la dirección', 'error');
      }
    });
  }

  filterAsentamientos(postalCode?: string): void {
    if (postalCode) {
      this.filteredAsentamientos = this.addressData
        .filter(item => item.estado === 'Hidalgo' && item.municipio === 'Pachuca de Soto' && item.cp.toString() === postalCode)
        .map(item => item.asentamiento);
    } else {
      const selectedCp = this.addressForm.get('postal_code')?.value;
      if (selectedCp) {
        this.filteredAsentamientos = this.addressData
          .filter(item => item.estado === 'Hidalgo' && item.municipio === 'Pachuca de Soto' && item.cp.toString() === selectedCp)
          .map(item => item.asentamiento);
      } else {
        this.filteredAsentamientos = [];
      }
    }
    this.addressForm.get('asentamiento')?.reset();
  }

  savePerfil(): void {
    if (this.addressForm.invalid) {
      this.toastService.showToast('Formulario inválido. Revisa los campos.', 'error');
      return;
    }

    const formValue = this.addressForm.getRawValue();
    const selectedAsentamiento = this.addressData.find(item => item.asentamiento === formValue.asentamiento && item.cp.toString() === formValue.postal_code);
    const addressData = {
      street: `${formValue.street}, ${formValue.asentamiento}, ${selectedAsentamiento?.zona || 'Urbano'}, ${selectedAsentamiento?.tipo || 'Colonia'}`,
      city: 'Pachuca',
      state: 'Hidalgo',
      postal_code: formValue.postal_code,
      is_primary: true
    };

    if (this.userProfile.address) {
      this.userService.updateUserProfile(addressData).subscribe({
        next: () => {
          this.toastService.showToast('Dirección actualizada exitosamente', 'success');
          this.getUserInfo();
          this.modal.close();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al actualizar la dirección';
          this.toastService.showToast(errorMessage, 'error');
        }
      });
    } else {
      this.userService.addAddress(addressData).subscribe({
        next: () => {
          this.toastService.showToast('Dirección creada exitosamente', 'success');
          this.getUserInfo();
          this.modal.close();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al crear la dirección';
          this.toastService.showToast(errorMessage, 'error');
        }
      });
    }
  }

  getUserInfo(): void {
    this.userService.getProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
      },
      error: (error) => {
        this.toastService.showToast(error?.error?.message || 'Error al obtener el perfil', 'error');
      }
    });
  }
}