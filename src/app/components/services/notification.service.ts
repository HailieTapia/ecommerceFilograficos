// src/app/components/services/notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/config';
import { CsrfService } from './csrf.service';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../../environments/firebase-config';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.baseUrl}/notifications`;

  constructor(
    private http: HttpClient,
    private csrfService: CsrfService
  ) {}

  async isSubscribed(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker no soportado');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker listo:', registration);
      const token = await getToken(messaging, { serviceWorkerRegistration: registration, vapidKey: environment.vapidKey}); // Añadimos vapidKey como placeholder
      console.log('Token obtenido:', token);
      return !!token;
    } catch (error: any) {
      console.error('Error checking subscription:', error.message, error.name, error.stack);
      return false;
    }
  }

  private sendSubscriptionToServer(token: string): Observable<any> {
    const subscriptionData = { token };
  
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        console.log('CSRF Token:', csrfToken);
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/subscribe`, subscriptionData, { headers, withCredentials: true });
      }),
      catchError((error: any) => {
        console.error('Error en sendSubscriptionToServer:', {
          status: error.status,
          message: error.message,
          error: error.error
        });
        return throwError(() => new Error(`Error al enviar la suscripción: ${error.message}`));
      })
    );
  }
  
  async subscribeToPush(userId: number): Promise<void> {
    try {
      console.log('Solicitando permiso para notificaciones...');
      const permission = await Notification.requestPermission();
      console.log('Permiso otorgado:', permission);
      if (permission !== 'granted') {
        throw new Error('Permiso de notificación denegado');
      }
  
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker listo para suscripción:', registration);
      const token = await getToken(messaging, { serviceWorkerRegistration: registration, vapidKey: environment.vapidKey });
      console.log('Token FCM:', token);
  
      if (!token) {
        throw new Error('No se pudo obtener el token de FCM');
      }
  
      console.log('Enviando token al servidor...');
      await this.sendSubscriptionToServer(token).toPromise();
    } catch (error: any) {
      console.error('Error al suscribirse:', error.message, error.name, error.stack);
      throw new Error(`Error al suscribirse: ${error.message}`);
    }
  }

  listenForMessages(): void {
    onMessage(messaging, (payload) => {
      console.log('Mensaje recibido en primer plano:', payload);
      const notificationTitle = payload.notification?.title || 'Notificación';
      const notificationOptions = {
        body: payload.notification?.body,
        icon: payload.notification?.icon || '/assets/icon.png'
      };

      new Notification(notificationTitle, notificationOptions);
    });
  }
}