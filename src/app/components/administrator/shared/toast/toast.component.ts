import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toastService';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule], 
  template: `
    <div *ngIf="toast" class="toast {{ toast.type }}">
      {{ toast.message }}
    </div>
  `,
  styles: [`
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 20px;
      border-radius: 5px;
      color: white;
      z-index: 1000;
    }
    .success { background-color: green; }
    .error { background-color: red; }
    .info { background-color: blue; }
    .warning { background-color: orange; } 
  `]
})
export class ToastComponent implements OnInit {
  toast: { message: string, type: 'success' | 'error' | 'info' | 'warning' } | null = null;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.toastService.toast$.subscribe(toast => {
      this.toast = toast;
    });
  }
}
