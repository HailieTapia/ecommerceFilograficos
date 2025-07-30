import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { UserService } from '../../../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../../../services/toastService';
import { ModalComponent } from '../../../reusable/modal/modal.component';
import * as addressData from '../../../administrator/shared/direccion.json';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [ModalComponent, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.css']
})
export class AddressesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('modal') modal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

  userProfile: any = {};
  addressForm: FormGroup;
  addressData: any[] = (addressData as any).default || addressData;
  uniquePostalCodes: string[] = [];
  filteredAsentamientos: string[] = [];
  confirmAction: (() => void) | null = null;
  confirmModalTitle: string = '';
  confirmModalMessage: string = '';
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';

  private subscriptions: Subscription = new Subscription();

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
    if (!this.modal || !this.confirmModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  openCreateModal(): void {
    if (!this.modal) {
      this.toastService.showToast('Error: Modal de dirección no inicializado', 'error');
      return;
    }
    this.addressForm.reset({ city: 'Pachuca', state: 'Hidalgo' });
    this.filteredAsentamientos = [];
    this.modal.title = 'Crear Dirección';
    this.modal.modalType = 'success';
    this.modal.isConfirmModal = false;
    this.modal.open();
  }

  openEditModal(): void {
    if (!this.modal) {
      this.toastService.showToast('Error: Modal de dirección no inicializado', 'error');
      return;
    }
    this.subscriptions.add(
      this.userService.getProfile().subscribe({
        next: (response) => {
          if (response.address) {
            const address = response.address;
            const streetParts = address.street.split(', ');
            const street = streetParts[0] || '';
            const asentamiento = streetParts[1] || '';
            const postalCode = address.postal_code;

            this.filterAsentamientos(postalCode);
            this.addressForm.patchValue({
              street,
              asentamiento,
              postal_code: postalCode,
              city: 'Pachuca',
              state: 'Hidalgo'
            });
            this.modal.title = 'Editar Dirección';
            this.modal.modalType = 'info';
            this.modal.isConfirmModal = false;
            this.modal.open();
          } else {
            this.toastService.showToast('No hay dirección para editar', 'error');
          }
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar la dirección';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  openConfirmModal(title: string, message: string, modalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default', action: () => void) {
    if (!this.confirmModal) {
      this.toastService.showToast('Error: Modal de confirmación no inicializado', 'error');
      return;
    }
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmModalType = modalType;
    this.confirmAction = action;
    this.confirmModal.title = title;
    this.confirmModal.modalType = modalType;
    this.confirmModal.isConfirmModal = true;
    this.confirmModal.confirmText = 'Confirmar';
    this.confirmModal.cancelText = 'Cancelar';
    this.confirmModal.open();
  }

  handleConfirm(): void {
    if (this.confirmAction) {
      this.confirmAction();
      this.confirmAction = null;
    }
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
      this.addressForm.markAllAsTouched();
      this.toastService.showToast('Formulario inválido. Revisa los campos.', 'error');
      return;
    }

    const formValue = this.addressForm.getRawValue();
    const selectedAsentamiento = this.addressData.find(item => item.asentamiento === formValue.asentamiento && item.cp.toString() === formValue.postal_code);
    if (!selectedAsentamiento) {
      this.toastService.showToast('Asentamiento no válido para el código postal seleccionado.', 'error');
      return;
    }
    const addressData = {
      street: `${formValue.street}, ${formValue.asentamiento}, ${selectedAsentamiento.zona || 'Urbano'}, ${selectedAsentamiento.tipo || 'Colonia'}`,
      city: 'Pachuca',
      state: 'Hidalgo',
      postal_code: formValue.postal_code,
      is_primary: true
    };

    this.subscriptions.add(
      (this.userProfile.address
        ? this.userService.updateUserProfile(addressData)
        : this.userService.addAddress(addressData)
      ).subscribe({
        next: () => {
          this.toastService.showToast(
            this.userProfile.address ? 'Dirección actualizada exitosamente' : 'Dirección creada exitosamente',
            'success'
          );
          this.getUserInfo();
          this.modal.close();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || `Error al ${this.userProfile.address ? 'actualizar' : 'crear'} la dirección`;
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  getUserInfo(): void {
    this.subscriptions.add(
      this.userService.getProfile().subscribe({
        next: (profile) => {
          this.userProfile = profile;
          this.toastService.showToast('Perfil cargado exitosamente.', 'success');
        },
        error: (error) => {
          const errorMessage = error?.error?.message || 'Error al obtener el perfil';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }
}