import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BackupService } from '../../services/backup.service';
import { ModalComponent } from '../../../modal/modal.component';
import { PaginationComponent } from '../pagination/pagination.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../services/toastService';
import { ActivatedRoute } from '@angular/router';

interface Backup {
  backup_id: string;
  created_at: string;
  file_name: string;
  status: string;
}

@Component({
  selector: 'app-backup-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModalComponent,
    PaginationComponent
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
  backupForm: FormGroup;
  dataTypesOptions = ['transactions', 'clients', 'configuration', 'full'];

  constructor(
    private backupService: BackupService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private route: ActivatedRoute
  ) {
    this.backupForm = this.fb.group({
      frequency: ['', Validators.required],
      destination: ['', Validators.required],
      data_types: [[], Validators.required],
      schedule_time: ['02:00:00', [Validators.required, Validators.pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)]]
    });
  }

  ngOnInit() {
    this.handleGoogleAuthCallback();
    this.checkAuthentication();
    this.loadBackupConfig();
  }

  checkAuthentication() {
    this.backupService.getBackupConfig().subscribe({
      next: (response) => {
        this.isAuthenticated = !!response.config?.refresh_token;
      },
      error: () => {
        this.isAuthenticated = false;
      }
    });
  }

  authenticateWithGoogle() {
    this.backupService.getGoogleAuthUrl().subscribe({
      next: (response) => {
        window.location.href = response.authUrl;
      },
      error: (err) => {
        this.toastService.showToast('Error al iniciar autenticación con Google', 'error');
        console.error('Error:', err);
      }
    });
  }

  handleGoogleAuthCallback() {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      if (code) {
        this.backupService.handleGoogleAuthCallback(code).subscribe({
          next: () => {
            this.toastService.showToast('Autenticación con Google Drive exitosa', 'success');
            this.checkAuthentication();
          },
          error: (err) => {
            this.toastService.showToast('Error en la autenticación con Google Drive', 'error');
            console.error('Error:', err);
          }
        });
      }
    });
  }

  loadBackupConfig() {
    this.backupService.getBackupConfig().subscribe({
      next: (response) => {
        const config = response.config;
        if (config) {
          this.backupForm.patchValue({
            frequency: config.frequency || 'daily',
            destination: config.storage_type || 'google_drive',
            data_types: config.data_types || ['transactions', 'clients'],
            schedule_time: config.schedule_time || '02:00:00'
          });
        }
      },
      error: (err) => console.error('Error loading backup config:', err)
    });
  }

  loadBackups() {
    this.backupService.listBackups().subscribe({
      next: (response) => {
        this.backups = response.backups;
        this.totalBackups = response.backups.length;
        this.totalPages = Math.ceil(this.totalBackups / this.itemsPerPage);
      },
      error: (err) => {
        this.toastService.showToast('Error al cargar el historial de respaldos', 'error');
        console.error('Error:', err);
      }
    });
  }

  openConfigModal() {
    this.configModal.open();
  }

  closeConfigModal() {
    this.configModal.close();
  }

  saveBackupConfig() {
    if (this.backupForm.valid) {
      const formData = {
        frequency: this.backupForm.value.frequency,
        data_types: this.backupForm.value.data_types,
        schedule_time: this.backupForm.value.schedule_time
      };
      this.backupService.configureBackup(formData).subscribe({
        next: () => {
          this.toastService.showToast('Configuración guardada con éxito', 'success');
          this.closeConfigModal();
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Error al guardar la configuración';
          this.toastService.showToast(errorMessage, 'error');
          console.error('Error:', err);
        }
      });
    } else {
      this.backupForm.markAllAsTouched();
      this.toastService.showToast('Por favor, completa todos los campos requeridos', 'error');
    }
  }

  runManualBackup() {
    this.backupService.runBackup().subscribe({
      next: () => {
        this.toastService.showToast('Respaldo manual iniciado con éxito', 'success');
        this.loadBackups();
      },
      error: (err) => {
        this.toastService.showToast('Error al iniciar respaldo manual', 'error');
        console.error('Error:', err);
      }
    }); // <- este era el cierre correcto
  }
  

  restoreBackup(backup: Backup) {
    this.toastService.showToast(
      `¿Estás seguro de que deseas restaurar el respaldo "${backup.file_name}"?`,
      'warning',
      'Confirmar',
      () => {
        this.backupService.restoreBackup({ backup_id: backup.backup_id }).subscribe({
          next: () => {
            this.toastService.showToast('Restauración iniciada con éxito', 'success');
            this.loadBackups();
          },
          error: (err) => {
            this.toastService.showToast('Error al restaurar el respaldo', 'error');
            console.error('Error:', err);
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
}