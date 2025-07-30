import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BannerService, Banner } from '../../services/banner.service';
import { ModalComponent } from '../../reusable/modal/modal.component';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../services/toastService';

@Component({
  selector: 'app-banner-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    ModalComponent
  ],
  templateUrl: './banner-admin.component.html',
  styleUrls: ['./banner-admin.component.css']
})
export class BannerAdminComponent implements OnInit, OnDestroy {
  @ViewChild('createEditModal') createEditModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

  banners: Banner[] = [];
  showLimitWarning = false;
  bannerForm: FormGroup;
  selectedBanner: Banner | null = null;
  isEditing = false;
  imagePreview: string | null = null;
  availableOrders: number[] = [];
  showBannersToUsers = true;
  private destroy$ = new Subject<void>();
  private loading = false;
  confirmAction: (() => void) | null = null;
  confirmModalTitle = '';
  confirmModalMessage = ''; // New property to store the message
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';
  confirmModalText = 'Confirmar';
  cancelModalText = 'Cancelar';

  constructor(
    private bannerService: BannerService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) {
    this.bannerForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      image: [null],
      cta_text: [''],
      cta_link: [''],
      order: [{ value: 1, disabled: true }, [Validators.min(1), Validators.max(5)]],
      is_active: [true]
    });
  }

  ngOnInit() {
    this.loadBanners();
    this.loadBannersVisibility();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBanners() {
    if (this.loading) return;
    this.loading = true;
    this.bannerService.getAllBanners().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: { success: boolean; banners: Banner[] }) => {
        if (response.success) {
          this.banners = response.banners;
          this.updateAvailableOrders();
        }
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.toastService.showToast('Error al cargar banners: ' + err.message, 'error');
        this.loading = false;
      }
    });
  }

  loadBannersVisibility() {
    this.bannerService.getBannersVisibility().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: { success: boolean; show_banners_to_users: boolean }) => {
        if (response.success) {
          this.showBannersToUsers = response.show_banners_to_users;
        }
      },
      error: (err: HttpErrorResponse) => {
        this.toastService.showToast('Error al cargar visibilidad de banners: ' + err.message, 'error');
      }
    });
  }

  updateAvailableOrders() {
    const usedOrders = this.banners.map(banner => banner.order).sort((a, b) => a - b);
    this.availableOrders = [];
    const editingOrder = this.isEditing && this.selectedBanner ? this.selectedBanner.order : null;

    for (let i = 1; i <= 5; i++) {
      if (!usedOrders.includes(i) || i === editingOrder) {
        this.availableOrders.push(i);
      }
    }

    if (this.isEditing && this.selectedBanner) {
      this.bannerForm.get('order')?.enable();
      this.bannerForm.patchValue({ order: this.selectedBanner.order });
    } else {
      this.bannerForm.get('order')?.disable();
      this.bannerForm.patchValue({ order: this.banners.length + 1 });
    }
  }

  openCreateModal() {
    if (this.banners.length >= 5) {
      this.showLimitWarning = true;
      this.toastService.showToast('No se pueden registrar más de 5 banners.', 'error');
      setTimeout(() => (this.showLimitWarning = false), 3000);
      return;
    }
    this.isEditing = false;
    this.selectedBanner = null;
    this.imagePreview = null;
    this.bannerForm.reset({ is_active: true });
    this.updateAvailableOrders();
    if (this.createEditModal) {
      this.createEditModal.modalType = 'success';
      this.createEditModal.open();
    }
  }

  openEditModal(banner: Banner) {
    this.isEditing = true;
    this.selectedBanner = banner;
    this.imagePreview = banner.image_url;
    this.bannerForm.patchValue(banner);
    this.updateAvailableOrders();
    if (this.createEditModal) {
      this.createEditModal.modalType = 'info';
      this.createEditModal.open();
    }
  }

  openConfirmModal(title: string, message: string, modalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default', action: () => void) {
    this.confirmModalTitle = title;
    this.confirmModalMessage = message; // Store the message
    this.confirmModalType = modalType;
    this.confirmModalText = 'Confirmar';
    this.cancelModalText = 'Cancelar';
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => (this.imagePreview = reader.result as string);
      reader.onerror = () => (this.imagePreview = null);
      reader.readAsDataURL(file);
      this.bannerForm.patchValue({ image: file });
    }
  }

  saveBanner() {
    if (this.bannerForm.invalid) {
      this.bannerForm.markAllAsTouched();
      this.toastService.showToast('Formulario inválido. Revisa los campos.', 'error');
      return;
    }

    const formData = new FormData();
    const formValue = this.bannerForm.value;
    formData.append('title', formValue.title);
    if (formValue.description) formData.append('description', formValue.description);
    if (formValue.image) formData.append('bannerImages', formValue.image);
    else if (!this.isEditing) {
      this.toastService.showToast('Debe seleccionar una imagen para crear un banner.', 'error');
      return;
    }
    if (formValue.cta_text) formData.append('cta_text', formValue.cta_text);
    if (formValue.cta_link) formData.append('cta_link', formValue.cta_link);
    if (this.isEditing) formData.append('order', formValue.order.toString());
    formData.append('is_active', formValue.is_active.toString());

    const request: Observable<any> = this.isEditing && this.selectedBanner
      ? this.bannerService.updateBanner(this.selectedBanner.banner_id, formData)
      : this.bannerService.createBanners(formData);

    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: { success: boolean; message: string; banners?: Banner[]; banner?: Banner }) => {
        this.loadBanners();
        if (this.createEditModal) this.createEditModal.close();
        this.toastService.showToast(response.message, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.toastService.showToast('Error al guardar banner: ' + err.message, 'error');
      }
    });
  }

  deleteBanner(banner: Banner) {
    this.openConfirmModal(
      'Eliminar Banner',
      `¿Estás seguro de que deseas eliminar el banner "${banner.title}"?`,
      'danger',
      () => {
        this.bannerService.deleteBanner(banner.banner_id).pipe(takeUntil(this.destroy$)).subscribe({
          next: (response: { success: boolean; message: string }) => {
            this.loadBanners();
            this.toastService.showToast(response.message, 'success');
            if (this.confirmModal) this.confirmModal.close();
          },
          error: (err: HttpErrorResponse) => {
            this.toastService.showToast('Error al eliminar banner: ' + err.message, 'error');
            if (this.confirmModal) this.confirmModal.close();
          }
        });
      }
    );
  }

  toggleActive(banner: Banner) {
    this.openConfirmModal(
      'Cambiar Estado del Banner',
      `¿Estás seguro de que deseas ${banner.is_active ? 'desactivar' : 'activar'} el banner "${banner.title}"?`,
      'warning',
      () => {
        const formData = new FormData();
        formData.append('is_active', (!banner.is_active).toString());
        this.bannerService.updateBanner(banner.banner_id, formData).pipe(takeUntil(this.destroy$)).subscribe({
          next: (response: { success: boolean; message: string; banner: Banner }) => {
            this.loadBanners();
            this.toastService.showToast(response.message, 'success');
            if (this.confirmModal) this.confirmModal.close();
          },
          error: (err: HttpErrorResponse) => {
            this.toastService.showToast('Error al actualizar estado: ' + err.message, 'error');
            if (this.confirmModal) this.confirmModal.close();
          }
        });
      }
    );
  }

  onVisibilityToggle(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.openConfirmModal(
      'Cambiar Visibilidad de Banners',
      `¿Estás seguro de ${checked ? 'mostrar' : 'ocultar'} los banners a los usuarios?`,
      'warning',
      () => {
        this.bannerService.toggleBannersVisibility(checked).pipe(takeUntil(this.destroy$)).subscribe({
          next: (response: { success: boolean; message: string; show_banners_to_users: boolean }) => {
            if (response.success) {
              this.showBannersToUsers = response.show_banners_to_users;
              this.toastService.showToast(response.message, 'success');
              if (this.confirmModal) this.confirmModal.close();
            }
          },
          error: (err: HttpErrorResponse) => {
            this.toastService.showToast('Error al cambiar visibilidad: ' + err.message, 'error');
            const input = event.target as HTMLInputElement;
            input.checked = this.showBannersToUsers; // Reset checkbox on error
            if (this.confirmModal) this.confirmModal.close();
          }
        });
      }
    );
  }

  handleConfirm() {
    if (this.confirmAction) {
      this.confirmAction();
      this.confirmAction = null;
    }
  }
}