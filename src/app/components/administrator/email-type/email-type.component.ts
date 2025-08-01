import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ModalComponent } from '../../reusable/modal/modal.component';
import { TypeService } from '../../../services/type.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { AbstractControl } from '@angular/forms';
import { ToastService } from '../../../services/toastService';
import { PaginationComponent } from '../pagination/pagination.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-email-type',
  imports: [ModalComponent, ReactiveFormsModule, CommonModule, FormsModule, PaginationComponent],
  standalone: true,
  templateUrl: './email-type.component.html',
  styleUrls: ['./email-type.component.css'],
})
export class EmailTypeComponent implements OnInit, OnDestroy {
  @ViewChild('createEditModal') createEditModal!: ModalComponent;
  @ViewChild('viewDetailsModal') viewDetailsModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

  emailTypeForm: FormGroup;
  emailTypeId: number | null = null;
  emailTypes: any[] = [];
  selectedEmailType: any = null;
  variablesList: string[] = [];
  variableControl: FormControl = new FormControl('', [Validators.required, Validators.pattern(/\S+/)]);

  confirmAction: (() => void) | null = null;
  confirmModalTitle: string = '';
  confirmModalMessage: string = '';
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  private destroy$ = new Subject<void>();
  private loading = false;

  constructor(private toastService: ToastService, private typeService: TypeService, private fb: FormBuilder) {
    this.emailTypeForm = this.fb.group({
      token: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[A-Z0-9_]+$/)]],
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(255)]],
      required_variables: [[], [
        Validators.required,
        (control: AbstractControl) => {
          return control.value && control.value.length > 0 ? null : { required: true };
        }
      ]]
    });
  }

  ngOnInit(): void {
    this.loadEmailTypes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    if (!this.createEditModal || !this.viewDetailsModal || !this.confirmModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }

  loadEmailTypes(): void {
    if (this.loading) return;
    this.loading = true;
    this.typeService.getEmailTypes(this.currentPage, this.itemsPerPage).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.emailTypes = data.emailTypes;
        this.totalItems = data.total;
        this.currentPage = data.page;
        this.itemsPerPage = data.pageSize;
        this.loading = false;
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener los tipos de correo electrónico';
        this.toastService.showToast(errorMessage, 'error');
        this.loading = false;
      }
    });
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadEmailTypes();
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadEmailTypes();
  }

  openViewModal(id: number): void {
    this.typeService.getEmailTypeById(id).subscribe({
      next: (data) => {
        this.selectedEmailType = data.emailType;
        if (this.viewDetailsModal) {
          this.viewDetailsModal.modalType = 'default';
          this.viewDetailsModal.title = 'Detalles del Tipo de Correo';
          this.viewDetailsModal.open();
        }
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener los detalles del tipo de correo';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  openEditModal(id: number): void {
    this.emailTypeId = id;
    this.typeService.getEmailTypeById(id).subscribe({
      next: (data) => {
        this.selectedEmailType = data.emailType;
        this.variablesList = data.emailType.required_variables || [];
        this.emailTypeForm.patchValue({
          token: data.emailType.token,
          name: data.emailType.name,
          description: data.emailType.description,
          required_variables: this.variablesList
        });
        if (this.createEditModal) {
          this.createEditModal.modalType = 'info';
          this.createEditModal.title = 'Editar Tipo de Correo';
          this.createEditModal.open();
        }
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener el tipo de correo';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  openCreateModal(): void {
    this.emailTypeId = null;
    this.variablesList = [];
    this.variableControl.reset();
    this.emailTypeForm.reset();
    if (this.createEditModal) {
      this.createEditModal.modalType = 'success';
      this.createEditModal.title = 'Crear Tipo de Correo';
      this.createEditModal.open();
    }
  }

  openConfirmModal(title: string, message: string, modalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default', action: () => void) {
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmModalType = modalType;
    this.confirmAction = action;
    if (this.confirmModal) {
      this.confirmModal.title = title;
      this.confirmModal.modalType = modalType;
      this.confirmModal.isConfirmModal = true;
      this.confirmModal.confirmText = 'Confirmar';
      this.confirmModal.cancelText = 'Cancelar';
      this.confirmModal.open();
    }
  }

  handleConfirm(): void {
    if (this.confirmAction) {
      this.confirmAction();
      this.confirmAction = null;
    }
  }

  addVariable(): void {
    const variable = this.variableControl.value.trim();
    if (this.variableControl.invalid) {
      this.toastService.showToast('La variable no puede estar vacía.', 'error');
      return;
    }
    if (this.variablesList.includes(variable)) {
      this.toastService.showToast('La variable ya está en la lista.', 'error');
      this.variableControl.reset();
      return;
    }
    this.variablesList.push(variable);
    this.variableControl.reset();
    this.emailTypeForm.patchValue({
      required_variables: this.variablesList
    });
    this.emailTypeForm.controls['required_variables'].updateValueAndValidity();
  }

  removeVariable(variable: string): void {
    this.variablesList = this.variablesList.filter(v => v !== variable);
    this.emailTypeForm.patchValue({
      required_variables: this.variablesList
    });
    this.emailTypeForm.controls['required_variables'].updateValueAndValidity();
  }

  submitEmailType(): void {
    if (this.emailTypeForm.invalid) {
      this.emailTypeForm.markAllAsTouched();
      this.toastService.showToast('Formulario inválido. Revisa los campos.', 'error');
      return;
    }

    const formData = { ...this.emailTypeForm.value };

    if (this.emailTypeId) {
      this.updateEmailType(this.emailTypeId, formData);
    } else {
      this.createEmailType(formData);
    }
  }

  private createEmailType(data: any): void {
    this.typeService.createEmailType(data).subscribe({
      next: (response) => {
        this.toastService.showToast('Tipo de correo electrónico creado exitosamente.', 'success');
        if (this.createEditModal) this.createEditModal.close();
        this.loadEmailTypes();
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al crear el tipo de correo electrónico';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  private updateEmailType(id: number, data: any): void {
    this.typeService.updateEmailType(id, data).subscribe({
      next: (response) => {
        this.toastService.showToast('Tipo de correo electrónico actualizado exitosamente.', 'success');
        if (this.createEditModal) this.createEditModal.close();
        this.loadEmailTypes();
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al actualizar el tipo de correo electrónico';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  deleteEmailType(id: number): void {
    const emailType = this.emailTypes.find(t => t.email_type_id === id);
    if (!emailType) {
      this.toastService.showToast('Tipo de correo no encontrado.', 'error');
      return;
    }
    this.openConfirmModal(
      'Eliminar Tipo de Correo',
      `¿Estás seguro de que deseas eliminar el tipo de correo "${emailType.name}"? Esta acción no se puede deshacer.`,
      'danger',
      () => {
        this.typeService.deleteEmailType(id).subscribe({
          next: (response) => {
            this.toastService.showToast(response.message || 'Tipo de correo eliminado exitosamente', 'success');
            this.loadEmailTypes();
            if (this.confirmModal) this.confirmModal.close();
          },
          error: (err) => {
            const errorMessage = err?.error?.message || 'Error al eliminar el tipo de correo';
            this.toastService.showToast(errorMessage, 'error');
            if (this.confirmModal) this.confirmModal.close();
          }
        });
      }
    );
  }
}