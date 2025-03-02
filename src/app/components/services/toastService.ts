import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new BehaviorSubject<{ message: string, type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  toast$ = this.toastSubject.asObservable();

  showToast(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.toastSubject.next({ message, type });

    // Ocultar después de 3 segundos
    setTimeout(() => {
      this.toastSubject.next(null);
    }, 3000);
  }
}
