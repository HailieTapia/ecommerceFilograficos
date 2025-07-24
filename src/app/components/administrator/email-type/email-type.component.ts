import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalComponent } from '../../../modal/modal.component';
import { TypeService } from '../../services/type.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { AbstractControl } from '@angular/forms';
import { ToastService } from '../../services/toastService';

@Component({
  selector: 'app-email-type',
  imports: [ModalComponent, ReactiveFormsModule, CommonModule, FormsModule],
  standalone: true,
  templateUrl: './email-type.component.html',
  styleUrls: ['./email-type.component.css'],
})
export class EmailTypeComponent implements OnInit {
  emailTypeForm: FormGroup;
  emailTypeId: number | null = null;
  emailTypes: any[] = [];
  selectedEmailType: any = null;
  variablesList: string[] = [];
  variableControl: FormControl = new FormControl('');

  @ViewChild('modal') modal!: ModalComponent;

  constructor(private toastService: ToastService, private typeService: TypeService, private fb: FormBuilder) {
    this.emailTypeForm = this.fb.group({
      token: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      required_variables: [[], [
        Validators.required,
        (control: AbstractControl) => {
          return control.value && control.value.length > 0 ? null : { required: true };
        }
      ]]
    });
  }

  ngOnInit(): void {
    this.getAllEmailTypes();
  }

  getAllEmailTypes(): void {
    this.typeService.getAllEmailTypes().subscribe({
      next: (data) => {
        this.emailTypes = data.emailTypes;
      },
      error: (err) => {
        this.toastService.showToast('Error al obtener los tipos de correo electrónico: ' + err.message, 'error');
      }
    });
  }

  deleteEmailType(id: number): void {
    this.toastService.showToast(
      '¿Estás seguro de que deseas eliminar este tipo? Esta acción no se puede deshacer.',
      'warning',
      'Confirmar',
      () => {
        this.typeService.deleteEmailType(id).subscribe({
          next: (response) => {
            this.toastService.showToast(response.message || 'Tipo eliminado exitosamente', 'success');
            this.getAllEmailTypes();
          },
          error: (error) => {
            const errorMessage = error?.error?.message || 'Error al eliminar el tipo de correo electrónico';
            this.toastService.showToast(errorMessage, 'error');
          }
        });
      }
    );
  }

  getEmailTypeById(id: number): void {
    this.typeService.getEmailTypeById(id).subscribe({
      next: (data) => {
        this.selectedEmailType = data.emailType;
        this.openModal(this.selectedEmailType);
      },
      error: (err) => {
        this.toastService.showToast('Error al obtener el tipo de correo electrónico: ' + err.message, 'error');
      }
    });
  }

  submitEmailType() {
    this.emailTypeForm.patchValue({
      required_variables: this.variablesList
    });

    if (this.emailTypeForm.invalid) {
      this.emailTypeForm.markAllAsTouched();
      this.toastService.showToast('Por favor, completa todos los campos requeridos.', 'error');
      return;
    }

    const formData = { ...this.emailTypeForm.value };

    if (this.emailTypeId) {
      this.updateEmailType(this.emailTypeId, formData);
    } else {
      this.createEmailType(formData);
    }
  }

  private createEmailType(data: any) {
    this.typeService.createEmailType(data).subscribe({
      next: (response) => {
        this.toastService.showToast('Tipo de correo electrónico creado exitosamente.', 'success');
        this.modal.close();
        this.getAllEmailTypes();
      },
      error: (error) => {
        this.toastService.showToast('Error al crear el tipo de correo electrónico: ' + error.message, 'error');
      }
    });
  }

  private updateEmailType(id: number, data: any) {
    this.typeService.updateEmailType(id, data).subscribe({
      next: (response) => {
        this.toastService.showToast('Tipo de correo electrónico actualizado exitosamente.', 'success');
        this.modal.close();
        this.getAllEmailTypes();
      },
      error: (error) => {
        this.toastService.showToast('Error al actualizar el tipo de correo electrónico: ' + error.message, 'error');
      }
    });
  }

  addVariable() {
    const variable = this.variableControl.value.trim();
    if (variable) {
      this.variablesList.push(variable);
      this.variableControl.reset();
      this.emailTypeForm.patchValue({
        required_variables: this.variablesList
      });
      this.emailTypeForm.controls['required_variables'].updateValueAndValidity();
    }
  }

  removeVariable(variable: string) {
    this.variablesList = this.variablesList.filter(v => v !== variable);
    this.emailTypeForm.patchValue({
      required_variables: this.variablesList
    });
    this.emailTypeForm.controls['required_variables'].updateValueAndValidity();
  }

  openModal(emailType?: any) {
    this.emailTypeForm.reset();
    this.variablesList = [];
    this.variableControl.reset();

    if (emailType) {
      this.emailTypeId = emailType.email_type_id;
      this.variablesList = emailType.required_variables || [];
      this.emailTypeForm.patchValue({
        token: emailType.token,
        name: emailType.name,
        description: emailType.description,
        required_variables: this.variablesList
      });
    } else {
      this.emailTypeId = null;
    }

    this.modal.open();
  }
}