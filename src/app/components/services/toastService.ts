import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new BehaviorSubject<{ message: string, type: 'success' | 'error' | 'info' | 'warning', actionText?: string, actionCallback?: () => void } | null>(null);
  toast$ = this.toastSubject.asObservable();

  showToast(message: string, type: 'success' | 'error' | 'info' | 'warning', actionText?: string, actionCallback?: () => void) {
    this.toastSubject.next({ message, type, actionText, actionCallback });

    // Ocultar después de 3 segundos si no es una confirmación
    if (!actionText) {
      setTimeout(() => {
        this.toastSubject.next(null);
      }, 3000);
    }
  }
  hideToast() {
    this.toastSubject.next(null); // Ocultar el toast
  }
}
