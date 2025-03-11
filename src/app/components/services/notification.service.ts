import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/config';
import { CsrfService } from './csrf.service';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { messaging } from '../../environments/firebase-config';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.baseUrl}/notifications`;
  private STORAGE_KEY = 'notification_state';

  constructor(
    private http: HttpClient,
    private csrfService: CsrfService
  ) {}

  // Obtener el estado almacenado en localStorage
  private getStoredState(): { permissionState: string; hasSubscribed: boolean } {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored
      ? JSON.parse(stored)
      : { permissionState: Notification.permission, hasSubscribed: false };
  }

  // Guardar el estado en localStorage
  private saveState(permissionState: string, hasSubscribed: boolean): void {
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify({ permissionState, hasSubscribed })
    );
  }

  // Verificar si el navegador soporta notificaciones
  private isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Verificar el estado de las notificaciones
  async checkNotificationStatus(): Promise<{ permission: string; subscribed: boolean }> {
    if (!this.isSupported()) {
      console.log('Notificaciones no soportadas en este navegador');
      return { permission: 'unsupported', subscribed: false };
    }

    const state = this.getStoredState();
    const permission = Notification.permission;
    let subscribed = state.hasSubscribed;

    // Si el permiso es granted y no está suscrito, intentar suscribir
    if (permission === 'granted' && !subscribed) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, {
          serviceWorkerRegistration: registration,
          vapidKey: environment.vapidKey
        });
        if (token) {
          await this.sendSubscriptionToServer(token).toPromise();
          this.saveState(permission, true);
          subscribed = true;
        }
      } catch (error) {
        console.error('Error al verificar suscripción:', error);
      }
    }

    return { permission, subscribed };
  }

  // Solicitar permiso y suscribir al usuario
  async requestPermissionAndSubscribe(): Promise<{ permission: string; subscribed: boolean }> {
    if (!this.isSupported()) {
      return { permission: 'unsupported', subscribed: false };
    }

    try {
      const permission = await Notification.requestPermission();
      let subscribed = false;

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, {
          serviceWorkerRegistration: registration,
          vapidKey: environment.vapidKey
        });
        if (token) {
          await this.sendSubscriptionToServer(token).toPromise();
          subscribed = true;
        }
      }

      this.saveState(permission, subscribed);
      return { permission, subscribed };
    } catch (error: any) {
      console.error('Error al solicitar permiso:', error);
      this.saveState(Notification.permission, false);
      return { permission: Notification.permission, subscribed: false };
    }
  }

  // Enviar la suscripción al backend
  private sendSubscriptionToServer(token: string): Observable<any> {
    const subscriptionData = { token };

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/subscribe`, subscriptionData, { headers, withCredentials: true });
      }),
      catchError((error: any) => {
        console.error('Error al enviar la suscripción:', error);
        return throwError(() => new Error(`Error al enviar la suscripción: ${error.message}`));
      })
    );
  }

  // Desuscribirse de las notificaciones
  async unsubscribeFromPush(): Promise<void> {
    try {
      // Eliminar el token FCM
      const registration = await navigator.serviceWorker.ready;
      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: environment.vapidKey
      });
      if (token) {
        await deleteToken(messaging);
      }

      // Eliminar la suscripción del backend
      await this.removeSubscriptionFromServer().toPromise();

      // Actualizar el estado
      this.saveState(Notification.permission, false);
    } catch (error: any) {
      console.error('Error al desuscribirse:', error);
      throw new Error(`Error al desuscribirse: ${error.message}`);
    }
  }

  // Eliminar la suscripción del backend
  private removeSubscriptionFromServer(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.delete(`${this.apiUrl}/unsubscribe`, { headers, withCredentials: true });
      }),
      catchError((error: any) => {
        console.error('Error al eliminar la suscripción:', error);
        return throwError(() => new Error(`Error al eliminar la suscripción: ${error.message}`));
      })
    );
  }

  // Escuchar mensajes en primer plano
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