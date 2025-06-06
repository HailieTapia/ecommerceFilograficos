import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BackupService } from '../../services/backup.service';
import { ModalComponent } from '../../../modal/modal.component';
import { PaginationComponent } from '../pagination/pagination.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../services/toastService';
import { ActivatedRoute } from '@angular/router';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';

interface Backup {
  backup_id: number;
  backup_datetime: string;
  status: string;
  data_type: string;
  BackupFiles?: { file_name: string }[];
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
  templateUrl: './backup-management.component.html'
})
export class BackupManagementComponent implements OnInit {
  @ViewChild('configModal') configModal!: ModalComponent;

  isAuthenticated = false;
  backups: Backup[] = [];
  totalBackups = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  isLoading = false;

  fullBackupForm: FormGroup;
  differentialBackupForm: FormGroup;

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
    private route: ActivatedRoute
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
    this.backupService.listBackups(this.selectedBackupType).subscribe({
      next: (response) => {
        this.backups = response.backups || [];
        this.totalBackups = this.backups.length;
        this.totalPages = Math.ceil(this.totalBackups / this.itemsPerPage);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
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

  closeConfigModal() {
    this.configModal.close();
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
      console.log('Datos enviados al backend:', formData);
      this.backupService.configureBackup(backupType, formData).subscribe({
        next: () => {
          this.toastService.showToast(`Configuración de respaldo ${backupType} guardada con éxito`, 'success');
          this.closeConfigModal();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error del backend:', err);
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

  runManualBackup(type: 'full' | 'differential') {
    this.isLoading = true;
    this.backupService.runBackup(type).subscribe({
      next: () => {
        this.toastService.showToast(`Respaldo manual ${type} iniciado con éxito`, 'success');
        this.loadBackups();
        this.isLoading = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || `Error al iniciar respaldo manual ${type}`;
        this.toastService.showToast(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  getBackupFileName(backup: Backup): string {
    return backup.BackupFiles && backup.BackupFiles.length > 0 ? backup.BackupFiles[0].file_name : 'N/A';
  }

  restoreBackup(backup: Backup) {
    this.toastService.showToast(
      `¿Estás seguro de que deseas restaurar el respaldo "${this.getBackupFileName(backup)}"?`,
      'warning',
      'Confirmar',
      () => {
        this.isLoading = true;
        this.backupService.restoreBackup(backup.backup_id).subscribe({
          next: () => {
            this.toastService.showToast('Restauración iniciada con éxito', 'success');
            this.loadBackups();
            this.isLoading = false;
          },
          error: (err) => {
            const errorMessage = err.error?.message || 'Error al restaurar el respaldo';
            this.toastService.showToast(errorMessage, 'error');
            this.isLoading = false;
          }
        });
      }
    );
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.loadBackups();
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.loadBackups();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  }

  compareArrays(arr1: any[], arr2: any[]): boolean {
    return JSON.stringify(arr1) === JSON.stringify(arr2);
  }
}