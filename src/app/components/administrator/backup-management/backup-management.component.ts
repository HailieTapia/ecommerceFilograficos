import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BackupService } from '../../../services/backup.service';
import { ModalComponent } from '../../reusable/modal/modal.component';
import { PaginationComponent } from '../pagination/pagination.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../../services/toastService';
import { ActivatedRoute } from '@angular/router';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';

registerLocaleData(localeEs);

interface Backup {
  backup_id: number;
  backup_datetime: string;
  status: string;
  data_type: string;
  file_name?: string;
  file_size?: number;
  checksum?: string;
  location?: string;
  performed_by?: number;
}

@Component({
  selector: 'app-backup-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModalComponent,
    PaginationComponent,
    SpinnerComponent
  ],
  templateUrl: './backup-management.component.html',
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
})
export class BackupManagementComponent implements OnInit {
  @ViewChild('configModal') configModal!: ModalComponent;
  @ViewChild('manualBackupModal') manualBackupModal!: ModalComponent;
  @ViewChild('restoreModal') restoreModal!: ModalComponent;
  @ViewChild('detailsModal') detailsModal!: ModalComponent;

  isAuthenticated = false;
  backups: Backup[] = [];
  totalBackups = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  isLoading = false;

  fullBackupForm: FormGroup;
  differentialBackupForm: FormGroup;
  selectedBackup: Backup | null = null;
  manualBackupType: 'full' | 'differential' | null = null;

  frequencyOptions = {
    full: ['weekly'],
    differential: ['daily']
  };
  dataTypesOptions = {
    full: ['all'],
    differential: ['all']
  };

  selectedBackupType: 'full' | 'differential' | undefined = undefined;
  activeTab: 'full' | 'differential' = 'full';

  constructor(
    private backupService: BackupService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private datePipe: DatePipe
  ) {
    this.fullBackupForm = this.fb.group({
      frequency: ['weekly', Validators.required],
      destination: ['google_drive', Validators.required],
      data_types: [['all'], Validators.required],
      schedule_time: ['00:00:00', [Validators.required, Validators.pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)]]
    });

    this.differentialBackupForm = this.fb.group({
      frequency: ['daily', Validators.required],
      destination: ['google_drive', Validators.required],
      data_types: [['all'], Validators.required],
      schedule_time: ['00:00:00', [Validators.required, Validators.pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)]]
    });
  }

  ngOnInit() {
    this.handleGoogleAuthCallback();
    this.checkAuthentication();
    this.loadBackupConfigs();
    this.loadBackups();
  }

  checkAuthentication() {
    this.isLoading = true;
    this.backupService.getBackupConfig('full').subscribe({
      next: (response) => {
        this.isAuthenticated = !!response.config?.refresh_token;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error checking authentication:', err);
        this.isAuthenticated = false;
        this.isLoading = false;
        this.toastService.showToast('Error al verificar autenticación', 'error');
      }
    });
  }

  authenticateWithGoogle() {
    this.isLoading = true;
    this.backupService.getGoogleAuthUrl().subscribe({
      next: (response) => {
        window.location.href = response.authUrl;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.showToast('Error al iniciar autenticación con Google', 'error');
      }
    });
  }

  handleGoogleAuthCallback() {
    this.isLoading = true;
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      if (code) {
        this.backupService.handleGoogleAuthCallback(code).subscribe({
          next: () => {
            this.toastService.showToast('Autenticación con Google Drive exitosa', 'success');
            this.checkAuthentication();
            this.isLoading = false;
          },
          error: (err) => {
            this.isLoading = false;
            this.toastService.showToast('Error en la autenticación con Google Drive', 'error');
          }
        });
      } else {
        this.isLoading = false;
      }
    });
  }

  loadBackupConfigs() {
    this.isLoading = true;
    this.backupService.getBackupConfig('full').subscribe({
      next: (response) => {
        const config = response.config;
        if (config) {
          this.fullBackupForm.patchValue({
            frequency: config.frequency || 'weekly',
            destination: config.storage_type || 'google_drive',
            data_types: config.data_types || ['all'],
            schedule_time: config.schedule_time || '00:00:00'
          });
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading full backup config:', err);
        this.isLoading = false;
        this.toastService.showToast('Error al cargar configuración de respaldo full', 'error');
      }
    });

    this.backupService.getBackupConfig('differential').subscribe({
      next: (response) => {
        const config = response.config;
        if (config) {
          this.differentialBackupForm.patchValue({
            frequency: config.frequency || 'daily',
            destination: config.storage_type || 'google_drive',
            data_types: config.data_types || ['all'],
            schedule_time: config.schedule_time || '00:00:00'
          });
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading differential backup config:', err);
        this.isLoading = false;
        this.toastService.showToast('Error al cargar configuración de respaldo diferencial', 'error');
      }
    });
  }

  loadBackups() {
    this.isLoading = true;
    this.backupService.listBackups(this.selectedBackupType, this.currentPage, this.itemsPerPage).subscribe({
      next: (response) => {
        if (response.success) {
          this.backups = response.data.backups || [];
          this.totalBackups = response.data.total || 0;
          this.currentPage = response.data.page || 1;
          this.itemsPerPage = response.data.pageSize || this.itemsPerPage;
          this.totalPages = Math.ceil(this.totalBackups / this.itemsPerPage);
        } else {
          this.backups = [];
          this.totalBackups = 0;
          this.totalPages = 1;
          this.toastService.showToast(response.message || 'Error al cargar el historial de respaldos', 'error');
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.backups = [];
        this.totalBackups = 0;
        this.totalPages = 1;
        this.toastService.showToast('Error al cargar el historial de respaldos', 'error');
      }
    });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadBackups();
  }

  openConfigModal() {
    this.configModal.open();
  }

  openManualBackupModal(type: 'full' | 'differential') {
    this.manualBackupType = type;
    this.manualBackupModal.open();
  }

  openRestoreModal(backup: Backup) {
    this.selectedBackup = backup;
    this.restoreModal.open();
  }

  openDetailsModal(backup: Backup) {
    this.selectedBackup = backup;
    this.detailsModal.open();
  }

  switchTab(tab: 'full' | 'differential') {
    this.activeTab = tab;
  }

  saveBackupConfig() {
    const form = this.activeTab === 'full' ? this.fullBackupForm : this.differentialBackupForm;
    const backupType = this.activeTab;

    if (!this.isAuthenticated) {
      this.toastService.showToast('Primero autentica con Google Drive', 'error');
      this.authenticateWithGoogle();
      return;
    }

    if (form.valid) {
      this.isLoading = true;
      const formData = {
        frequency: form.value.frequency,
        data_types: form.value.data_types,
        schedule_time: form.value.schedule_time
      };
      this.backupService.configureBackup(backupType, formData).subscribe({
        next: () => {
          this.toastService.showToast(`Configuración de respaldo ${backupType} guardada con éxito`, 'success');
          this.configModal.close();
          this.isLoading = false;
        },
        error: (err) => {
          const errorMessage = err.error?.message || `Error al guardar la configuración de ${backupType}`;
          this.toastService.showToast(errorMessage, 'error');
          this.isLoading = false;
        }
      });
    } else {
      form.markAllAsTouched();
      this.toastService.showToast('Por favor, completa todos los campos requeridos', 'error');
    }
  }

  runManualBackup() {
    if (!this.manualBackupType) return;
    this.isLoading = true;
    this.backupService.runBackup(this.manualBackupType).subscribe({
      next: () => {
        this.toastService.showToast(`Respaldo manual ${this.manualBackupType} iniciado con éxito`, 'success');
        this.loadBackups();
        this.manualBackupModal.close();
        this.isLoading = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || `Error al iniciar respaldo manual ${this.manualBackupType}`;
        this.toastService.showToast(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  restoreBackup() {
    if (!this.selectedBackup) return;
    this.isLoading = true;
    this.backupService.restoreBackup(this.selectedBackup.backup_id).subscribe({
      next: () => {
        this.toastService.showToast('Restauración iniciada con éxito', 'success');
        this.loadBackups();
        this.restoreModal.close();
        this.isLoading = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Error al restaurar el respaldo';
        this.toastService.showToast(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  getBackupFileName(backup: Backup): string {
    return backup.file_name || 'N/A';
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.loadBackups();
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.loadBackups();
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return 'Nunca';
    return this.datePipe.transform(date, "d 'de' MMMM 'de' yyyy HH:mm", undefined, 'es') || 'Nunca';
  }

  compareArrays(arr1: any[], arr2: any[]): boolean {
    return JSON.stringify(arr1) === JSON.stringify(arr2);
  }
}