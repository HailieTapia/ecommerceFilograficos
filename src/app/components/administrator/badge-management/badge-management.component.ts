// badge-management.component.ts (Actualizado con Debounce Correcto)
import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { BadgeService, Badge } from '../../../services/badge.service';
import { BadgeCategoryService, BadgeCategory } from '../../../services/badge-category.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { ModalComponent } from '../../reusable/modal/modal.component';
import { ToastService } from '../../../services/toastService';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of, Subscription, Subject } from 'rxjs'; // Importar Subject
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { BadgeHistoryComponent } from './badge-history/badge-history.component';

// Registrar localización para español
registerLocaleData(localeEs);

@Component({
  selector: 'app-badge-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
    ModalComponent,
    DatePipe,
    BadgeHistoryComponent
  ],
  templateUrl: './badge-management.component.html',
  styleUrls: ['./badge-management.component.css'],
  providers: [
    DatePipe,
    { provide: 'LOCALE_ID', useValue: 'es' }
  ]
})
export class BadgeManagementComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('createEditModal') createEditModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

  // Propiedades de la vista
  activeTab: 'management' | 'history' = 'management';

  // Propiedades para gestión de insignias
  badges: Badge[] = [];
  badgeCategories: BadgeCategory[] = [];
  totalBadges = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searchTerm = '';
  statusFilter: 'active' | 'inactive' | 'all' = 'active';
  badgeForm!: FormGroup;
  selectedBadgeId: string | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  // Propiedades comunes
  private subscriptions: Subscription = new Subscription();
  private searchSubject = new Subject<string>(); // Subject para el debounce
  confirmAction: (() => void) | null = null;
  confirmModalTitle = '';
  confirmModalMessage = '';
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';
  isLoading = false;

  constructor(
    private badgeService: BadgeService,
    private badgeCategoryService: BadgeCategoryService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    // Formulario para gestión de insignias
    this.badgeForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        this.noSpecialCharsValidator,
        this.noSQLInjectionValidator
      ]],
      description: ['', [
        Validators.maxLength(500),
        this.noSpecialCharsValidator,
        this.noSQLInjectionValidator
      ]],
      badge_category_id: ['', [
        Validators.required,
        Validators.min(1)
      ]],
      badgeIcon: [null, this.selectedBadgeId ? [] : [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadBadgeCategories();
    this.loadBadges();

    // Suscripción para manejar el Debounce de la búsqueda
    this.subscriptions.add(
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(() => {
        // La lógica de carga real se ejecuta aquí, después del debounce
        this.loadBadges();
      })
    );
  }

  ngAfterViewInit(): void {
    if (!this.createEditModal || !this.confirmModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.searchSubject.complete(); // Completar el Subject para liberar recursos
  }

  // Navegación entre pestañas
  setActiveTab(tab: 'management' | 'history'): void {
    this.activeTab = tab;
    if (tab === 'management') {
      this.loadBadges();
    }
  }

  // Gestión de insignias
  loadBadges(): void {
    if (this.activeTab !== 'management') return;
    this.isLoading = true;
    this.subscriptions.add(
      this.badgeService.getAllBadges(this.currentPage, this.itemsPerPage, this.searchTerm, this.statusFilter).subscribe({
        next: (response) => {
          this.badges = response.badges;
          this.totalBadges = response.total;
          this.totalPages = Math.ceil(response.total / this.itemsPerPage);
          this.isLoading = false;
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar las insignias';
          this.toastService.showToast(errorMessage, 'error');
          this.isLoading = false;
        }
      })
    );
  }

  loadBadgeCategories(): void {
    this.subscriptions.add(
      this.badgeCategoryService.getAllBadgeCategories(1, 100, '', 'active').subscribe({
        next: (response) => {
          this.badgeCategories = response.badgeCategories;
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar las categorías de insignias';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadBadges();
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadBadges();
  }

  // **Actualizado:** Emite el término de búsqueda al Subject para que el debounce lo maneje
  onSearchChange(): void {
    this.currentPage = 1;
    this.searchSubject.next(this.searchTerm);
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadBadges();
  }

  // Método debounceSearch anterior eliminado, la lógica está ahora en ngOnInit con el Subject

  openCreateModal(): void {
    if (!this.createEditModal) {
      this.toastService.showToast('Error: Modal de creación no inicializado', 'error');
      return;
    }
    this.selectedBadgeId = null;
    this.selectedFile = null;
    this.imagePreview = null;
    this.badgeForm.reset();
    this.badgeForm.get('badgeIcon')?.setValidators([Validators.required]);
    this.badgeForm.get('badgeIcon')?.updateValueAndValidity();
    this.createEditModal.modalType = 'success';
    this.createEditModal.title = 'Crear Insignia';
    this.createEditModal.open();
  }

  openEditModal(badge: Badge): void {
    if (!this.createEditModal) {
      this.toastService.showToast('Error: Modal de edición no inicializado', 'error');
      return;
    }
    this.selectedBadgeId = badge.badge_id.toString();
    this.selectedFile = null;
    this.imagePreview = badge.icon_url;
    this.subscriptions.add(
      this.badgeService.getBadgeById(badge.badge_id.toString()).subscribe({
        next: (response) => {
          this.badgeForm.patchValue({
            name: response.badge.name,
            description: response.badge.description,
            badge_category_id: response.badge.badge_category_id,
            badgeIcon: null
          });
          this.badgeForm.get('badgeIcon')?.clearValidators();
          this.badgeForm.get('badgeIcon')?.updateValueAndValidity();
          this.createEditModal.modalType = 'info';
          this.createEditModal.title = 'Editar Insignia';
          this.createEditModal.open();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar los detalles de la insignia';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  saveBadge(): void {
    if (this.badgeForm.invalid) {
      this.badgeForm.markAllAsTouched();
      this.toastService.showToast('Formulario inválido. Revisa los campos.', 'error');
      return;
    }

    const badgeData = {
      name: this.sanitizeInput(this.badgeForm.value.name),
      description: this.sanitizeInput(this.badgeForm.value.description || ''),
      badge_category_id: this.badgeForm.value.badge_category_id
    };

    const serviceCall = this.selectedBadgeId
      ? this.badgeService.updateBadge(this.selectedBadgeId, badgeData, this.selectedFile || undefined)
      : this.badgeService.createBadge(badgeData, this.selectedFile!);

    this.subscriptions.add(
      serviceCall.subscribe({
        next: () => {
          this.toastService.showToast(
            this.selectedBadgeId ? 'Insignia actualizada exitosamente' : 'Insignia creada exitosamente',
            'success'
          );
          this.loadBadges();
          this.createEditModal?.close();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al guardar la insignia';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  deleteBadge(badge: Badge): void {
    this.openConfirmModal(
      'Eliminar Insignia',
      `¿Estás seguro de que deseas eliminar la insignia "${badge.name}"? Esta acción no se puede deshacer.`,
      'danger',
      () => {
        this.subscriptions.add(
          this.badgeService.deleteBadge(badge.badge_id.toString()).subscribe({
            next: () => {
              this.toastService.showToast('Insignia eliminada exitosamente', 'success');
              this.loadBadges();
              this.confirmModal?.close();
            },
            error: (err) => {
              const errorMessage = err?.error?.message || 'Error al eliminar la insignia';
              this.toastService.showToast(errorMessage, 'error');
              this.confirmModal?.close();
            }
          })
        );
      }
    );
  }

  // Validaciones y utilidades
  noSpecialCharsValidator(control: AbstractControl) {
    const hasDangerousChars = /[<>'"`;]/.test(control.value);
    return hasDangerousChars ? { invalidContent: true } : null;
  }

  noSQLInjectionValidator(control: AbstractControl) {
    const sqlKeywords = /(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|EXEC|UNION|GRANT|REVOKE)/i;
    return sqlKeywords.test(control.value) ? { invalidContent: true } : null;
  }

  sanitizeInput(input: string): string {
    // Limpieza de caracteres peligrosos y palabras clave SQL
    return input.replace(/[<>'"`;]/g, '').replace(/(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|EXEC|UNION|GRANT|REVOKE)/gi, '');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSizeBytes = 1 * 1024 * 1024; // 1MB

      if (!validFormats.includes(file.type)) {
        this.toastService.showToast('Solo se permiten archivos JPG, JPEG, PNG o WEBP', 'error');
        this.selectedFile = null;
        this.imagePreview = null;
        this.badgeForm.get('badgeIcon')?.setValue(null);
        this.badgeForm.get('badgeIcon')?.markAsTouched();
        return;
      }
      if (file.size > maxSizeBytes) {
        this.toastService.showToast('El archivo no puede exceder 1MB', 'error');
        this.selectedFile = null;
        this.imagePreview = null;
        this.badgeForm.get('badgeIcon')?.setValue(null);
        this.badgeForm.get('badgeIcon')?.markAsTouched();
        return;
      }
      
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.badgeForm.get('badgeIcon')?.setValue('selected');
        this.badgeForm.get('badgeIcon')?.markAsTouched();
      };
      reader.onerror = () => {
        this.imagePreview = null;
        this.badgeForm.get('badgeIcon')?.setValue(null);
        this.badgeForm.get('badgeIcon')?.markAsTouched();
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedFile = null;
      this.imagePreview = null;
      this.badgeForm.get('badgeIcon')?.setValue(null);
      this.badgeForm.get('badgeIcon')?.markAsTouched();
    }
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

  formatDate(date: string): string {
    return this.datePipe.transform(date, "d 'de' MMMM 'de' yyyy", undefined, 'es') || 'Fecha no disponible';
  }
}