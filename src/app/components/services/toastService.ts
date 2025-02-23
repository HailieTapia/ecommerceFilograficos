import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root', // Esto hace que el servicio esté disponible en toda la aplicación
})
export class ToastService {
  private toastSubject = new BehaviorSubject<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  toast$ = this.toastSubject.asObservable();

  showToast(message: string, type: 'success' | 'error' | 'info') {
    this.toastSubject.next({ message, type });
    setTimeout(() => this.toastSubject.next(null), 3000); // Ocultar el toast después de 3 segundos
  }
}