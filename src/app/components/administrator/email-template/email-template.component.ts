import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ModalComponent } from '../../reusable/modal/modal.component';
import { TemplateService } from '../../../services/template.service';
import { TypeService } from '../../../services/type.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toastService';
import { PaginationComponent } from '../pagination/pagination.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-email-template',
  standalone: true,
  imports: [ModalComponent, CommonModule, ReactiveFormsModule, FormsModule, PaginationComponent],
  templateUrl: './email-template.component.html',
  styleUrls: ['./email-template.component.css']
})
export class EmailTemplateComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('createEditModal') createEditModal!: ModalComponent;
  @ViewChild('viewDetailsModal') viewDetailsModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

  emailTemplateForm: FormGroup;
  emailTemplates: any[] = [];
  emailTypes: any[] = [];
  emailTemplateId: number | null = null;
  selectedEmailTemplate: any = null;
  confirmAction: (() => void) | null = null;
  confirmModalTitle: string = '';
  confirmModalMessage: string = '';
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  private destroy$ = new Subject<void>();
  private loading = false;

  constructor(
    private toastService: ToastService,
    private templateService: TemplateService,
    private typeService: TypeService,
    private fb: FormBuilder
  ) {
    this.emailTemplateForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email_type_id: ['', [Validators.required]],
      subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      html_content: ['', [Validators.required]],
      text_content: ['', [Validators.required]],
      variables: [{ value: '', disabled: true }, [Validators.required]]
    });

    // Subscribe to email_type_id changes to update variables
    this.emailTemplateForm.get('email_type_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(emailTypeId => {
      const selectedType = this.emailTypes.find(type => type.email_type_id === +emailTypeId);
      const variables = selectedType?.required_variables || [];
      this.emailTemplateForm.get('variables')?.setValue(JSON.stringify(variables));
    });
  }

  ngOnInit(): void {
    this.loadEmailTemplates();
    this.loadEmailTypes();
  }

  ngAfterViewInit(): void {
    if (!this.createEditModal || !this.viewDetailsModal || !this.confirmModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEmailTypes(): void {
    this.typeService.getAllEmailTypes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.emailTypes = data.emailTypes;
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener los tipos de correo electrónico';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  loadEmailTemplates(): void {
    if (this.loading) return;
    this.loading = true;
    this.templateService.getPaginatedTemplates(this.currentPage, this.itemsPerPage).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.emailTemplates = data.templates;
        this.totalItems = data.total;
        this.currentPage = data.page;
        this.itemsPerPage = data.pageSize;
        this.loading = false;
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener las plantillas de correo electrónico';
        this.toastService.showToast(errorMessage, 'error');
        this.loading = false;
      }
    });
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadEmailTemplates();
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadEmailTemplates();
  }

  openViewModal(templateId: number): void {
    this.templateService.getEmailTemplateById(templateId).subscribe({
      next: (data) => {
        this.selectedEmailTemplate = data;
        if (this.viewDetailsModal) {
          this.viewDetailsModal.modalType = 'default';
          this.viewDetailsModal.title = 'Detalles de la Plantilla';
          this.viewDetailsModal.open();
        }
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener los detalles de la plantilla';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  openEditModal(templateId: number): void {
    this.emailTemplateId = templateId;
    this.templateService.getEmailTemplateById(templateId).subscribe({
      next: (template) => {
        if (template?.active) {
          this.emailTemplateForm.patchValue({
            name: template.name,
            email_type_id: template.email_type_id,
            subject: template.subject,
            html_content: template.html_content,
            text_content: template.text_content,
            variables: JSON.stringify(template.variables)
          });
          if (this.createEditModal) {
            this.createEditModal.modalType = 'info';
            this.createEditModal.title = 'Editar Plantilla';
            this.createEditModal.open();
          }
        } else {
          this.toastService.showToast('La plantilla no está disponible para edición.', 'error');
        }
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al obtener la plantilla';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  openCreateModal(): void {
    this.emailTemplateId = null;
    this.emailTemplateForm.reset();
    if (this.createEditModal) {
      this.createEditModal.modalType = 'success';
      this.createEditModal.title = 'Crear Plantilla';
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

  saveTemplate(): void {
    if (this.emailTemplateForm.invalid) {
      this.emailTemplateForm.markAllAsTouched();
      this.toastService.showToast('Formulario inválido. Revisa los campos.', 'error');
      return;
    }

    const templateData = {
      ...this.emailTemplateForm.getRawValue(),
      variables: JSON.parse(this.emailTemplateForm.getRawValue().variables)
    };

    const saveAction = this.emailTemplateId
      ? this.templateService.updateEmailTemplate(this.emailTemplateId, templateData)
      : this.templateService.createEmailTemplate(templateData);

    saveAction.subscribe({
      next: () => {
        this.toastService.showToast(
          this.emailTemplateId ? 'Plantilla actualizada exitosamente' : 'Plantilla creada exitosamente',
          'success'
        );
        this.loadEmailTemplates();
        if (this.createEditModal) this.createEditModal.close();
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al guardar la plantilla';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  deleteEmailTemplate(id: number): void {
    const template = this.emailTemplates.find(t => t.template_id === id);
    if (!template) {
      this.toastService.showToast('Plantilla no encontrada.', 'error');
      return;
    }
    this.openConfirmModal(
      'Eliminar Plantilla',
      `¿Estás seguro de que deseas eliminar la plantilla "${template.name}"? Esta acción no se puede deshacer.`,
      'danger',
      () => {
        this.templateService.deleteEmailTemplate(id).subscribe({
          next: (response) => {
            this.toastService.showToast(response.message || 'Plantilla eliminada exitosamente', 'success');
            this.loadEmailTemplates();
            if (this.confirmModal) this.confirmModal.close();
          },
          error: (err) => {
            const errorMessage = err?.error?.message || 'Error al eliminar la plantilla';
            this.toastService.showToast(errorMessage, 'error');
            if (this.confirmModal) this.confirmModal.close();
          }
        });
      }
    );
  }
}