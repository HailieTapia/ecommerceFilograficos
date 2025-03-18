import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BannerService, Banner } from '../../services/banner.service';
import { ModalComponent } from '../../../modal/modal.component';
import { HttpErrorResponse } from '@angular/common/http';

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
  @ViewChild('bannerModal') bannerModal!: ModalComponent;
  @ViewChild('deleteModal') deleteModal!: ModalComponent;
  @ViewChild('visibilityModal') visibilityModal!: ModalComponent;

  banners: Banner[] = [];
  showLimitWarning = false;
  bannerForm: FormGroup;
  selectedBanner: Banner | null = null;
  isEditing = false;
  imagePreview: string | null = null;
  availableOrders: number[] = [];
  showBannersToUsers = true;
  pendingVisibilityChange: boolean | null = null;
  private destroy$ = new Subject<void>();
  private loading = false;

  constructor(
    private bannerService: BannerService,
    private fb: FormBuilder
  ) {
    this.bannerForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      image: [null],
      cta_text: [''],
      cta_link: [''],
      order: [{ value: 1, disabled: true }, [Validators.min(1), Validators.max(5)]], // Deshabilitado en creación
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
        console.error('Error al cargar banners:', err.message);
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
        console.error('Error al cargar visibilidad de banners:', err.message);
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
      setTimeout(() => (this.showLimitWarning = false), 3000);
      return;
    }
    this.isEditing = false;
    this.selectedBanner = null;
    this.imagePreview = null;
    this.bannerForm.reset({ is_active: true });
    this.updateAvailableOrders();
    if (this.bannerModal) this.bannerModal.open();
  }

  openEditModal(banner: Banner) {
    this.isEditing = true;
    this.selectedBanner = banner;
    this.imagePreview = banner.image_url;
    this.bannerForm.patchValue(banner);
    this.updateAvailableOrders();
    if (this.bannerModal) this.bannerModal.open();
  }

  openDeleteModal(banner: Banner) {
    this.selectedBanner = banner;
    if (this.deleteModal) this.deleteModal.open();
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
      alert('Formulario inválido. Revisa los campos.');
      return;
    }

    const formData = new FormData();
    const formValue = this.bannerForm.value;
    formData.append('title', formValue.title);
    if (formValue.description) formData.append('description', formValue.description);
    if (formValue.image) formData.append('bannerImages', formValue.image);
    else if (!this.isEditing) {
      alert('Debe seleccionar una imagen para crear un banner');
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
        if (this.bannerModal) this.bannerModal.close();
        alert(response.message);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al guardar banner:', err.message);
        alert(err.message);
      }
    });
  }

  confirmDelete() {
    if (!this.selectedBanner) return;

    this.bannerService.deleteBanner(this.selectedBanner.banner_id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: { success: boolean; message: string }) => {
        this.loadBanners();
        if (this.deleteModal) this.deleteModal.close();
        alert(response.message);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al eliminar banner:', err.message);
        alert(err.message);
      }
    });
  }

  toggleActive(banner: Banner) {
    const formData = new FormData();
    formData.append('is_active', (!banner.is_active).toString());
    this.bannerService.updateBanner(banner.banner_id, formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: { success: boolean; message: string; banner: Banner }) => {
        this.loadBanners();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al actualizar estado:', err.message);
        alert(err.message);
      }
    });
  }

  onVisibilityToggle(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.pendingVisibilityChange = checked;
    if (this.visibilityModal) this.visibilityModal.open();
  }

  confirmVisibilityChange() {
    if (this.pendingVisibilityChange === null) return;

    this.bannerService.toggleBannersVisibility(this.pendingVisibilityChange).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: { success: boolean; message: string; show_banners_to_users: boolean }) => {
        if (response.success) {
          this.showBannersToUsers = response.show_banners_to_users;
          if (this.visibilityModal) this.visibilityModal.close();
          this.pendingVisibilityChange = null;
          alert(response.message);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cambiar visibilidad de banners:', err.message);
        alert(err.message);
        if (this.visibilityModal) this.visibilityModal.close();
        this.pendingVisibilityChange = null;
      }
    });
  }

  cancelVisibilityChange() {
    this.pendingVisibilityChange = null;
    if (this.visibilityModal) this.visibilityModal.close();
  }
}