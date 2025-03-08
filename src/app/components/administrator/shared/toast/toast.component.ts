import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toastService';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="toast" class="toast" [ngClass]="toast.type">
      <div class="toast-content">
        <span class="toast-icon">
          <i [ngClass]="getIconClass()"></i>
        </span>
        <span class="toast-message">{{ toast.message }}</span>
        <div class="toast-actions">
          <!-- Botones para confirmación -->
          <button *ngIf="toast.actionText" (click)="handleAction()" class="action-btn">
            {{ toast.actionText }}
          </button>
          <button *ngIf="toast.actionText" (click)="cancelAction()" class="cancel-btn">
            Cancelar
          </button>
          <!-- Botón cerrar para mensajes sin acción -->
          <button *ngIf="!toast.actionText" (click)="closeToast()" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      max-width: 400px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 15px;
      color: white;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .success { background-color: #34c759; }
    .error { background-color: #ff3b30; }
    .info { background-color: #007aff; }
    .warning { background-color: #ff9500; }

    .toast-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .toast-icon {
      font-size: 20px;
    }

    .toast-message {
      flex: 1;
      font-size: 14px;
    }

    .toast-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .action-btn:hover {
      background-color: rgba(255, 255, 255, 0.3);
    }

    .cancel-btn {
      background-color: transparent;
      color: white;
      padding: 6px 12px;
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .cancel-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      padding: 0;
      margin-left: 10px;
    }

    .close-btn:hover {
      color: rgba(255, 255, 255, 0.8);
    }
  `]
})
export class ToastComponent implements OnInit {
  toast: { 
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning', 
    actionText?: string, 
    actionCallback?: () => void 
  } | null = null;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.toastService.toast$.subscribe(toast => {
      this.toast = toast;
    });
  }

  handleAction() {
    if (this.toast?.actionCallback) {
      this.toast.actionCallback();
    }
    this.toastService.hideToast(); // Ocultar después de la acción
  }

  cancelAction() {
    this.toastService.hideToast(); // Ocultar al cancelar
  }

  closeToast() {
    this.toastService.hideToast(); // Ocultar manualmente
  }

  getIconClass(): string {
    switch (this.toast?.type) {
      case 'success': return 'fas fa-check-circle';
      case 'error': return 'fas fa-exclamation-circle';
      case 'info': return 'fas fa-info-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      default: return '';
    }
  }
}