import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../environments/config';
import { CsrfService } from './csrf.service';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { messaging } from '../environments/firebase-config';

// Definir la interfaz para las categorías del backend
interface BackendCategories {
  special_offers: boolean;
  event_reminders: boolean;
  news_updates: boolean;
  order_updates: boolean;
  urgent_orders: boolean;
  design_reviews: boolean;
  stock_alerts: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.baseUrl}/notifications`;
  private communicationUrl = `${environment.baseUrl}/communication`;
  private STORAGE_KEY = 'notification_state';

  constructor(
    private http: HttpClient,
    private csrfService: CsrfService
  ) {}

  // Obtener el estado almacenado en localStorage
  private getStoredState(): { permissionState: string; hasPrompted: boolean } {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored
      ? JSON.parse(stored)
      : { permissionState: Notification.permission, hasPrompted: false };
  }

  // Guardar el estado en localStorage
  private saveState(permissionState: string, hasPrompted: boolean): void {
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify({ permissionState, hasPrompted })
    );
  }

  // Verificar si el navegador soporta notificaciones
  private isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Obtener las preferencias de comunicación
  getCommunicationPreferences(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(this.communicationUrl, { headers, withCredentials: true });
      }),
      catchError((error: any) => {
        console.error('Error al obtener preferencias:', error);
        return throwError(() => new Error(`Error al obtener preferencias: ${error.message}`));
      })
    );
  }

  // Actualizar las preferencias de comunicación
  updateCommunicationPreferences(methods: string[], categories: BackendCategories): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put(this.communicationUrl, { methods, categories }, { headers, withCredentials: true });
      }),
      catchError((error: any) => {
        console.error('Error al actualizar preferencias:', error);
        return throwError(() => new Error(`Error al actualizar preferencias: ${error.message}`));
      })
    );
  }

  // Verificar el estado de las notificaciones
  async checkNotificationStatus(): Promise<{ permission: string; hasPush: boolean; hasPrompted: boolean }> {
    if (!this.isSupported()) {
      console.log('Notificaciones no soportadas en este navegador');
      return { permission: 'unsupported', hasPush: false, hasPrompted: false };
    }

    const state = this.getStoredState();
    const permission = Notification.permission;
    let hasPush = false;

    try {
      const response = await this.getCommunicationPreferences().toPromise();
      hasPush = response.preferences?.methods.includes('push') || false;
    } catch (error) {
      console.error('Error al verificar preferencias:', error);
    }

    return { permission, hasPush, hasPrompted: state.hasPrompted };
  }

  // Solicitar permiso y suscribir al usuario
  async requestPermissionAndSubscribe(): Promise<{ permission: string; subscribed: boolean }> {
    if (!this.isSupported()) {
      console.log('Notificaciones no soportadas en este navegador');
      return { permission: 'unsupported', subscribed: false };
    }
  
    try {
      console.log('Solicitando permiso de notificación...');
      const permission = await Notification.requestPermission();
      console.log('Permiso de notificación:', permission);
  
      let subscribed = false;
      if (permission === 'granted') {
        console.log('Permiso concedido, esperando Service Worker...');
        const registration = await navigator.serviceWorker.ready;
        console.log('Service Worker registrado:', registration);
  
        console.log('Obteniendo token de FCM...');
        const token = await getToken(messaging, {
          serviceWorkerRegistration: registration,
          vapidKey: environment.vapidKey
        }).catch((error) => {
          console.error('Error al obtener token de FCM:', error);
          throw error;
        });
        console.log('Token de FCM obtenido:', token);
  
        if (token) {
          console.log('Enviando suscripción al servidor...');
          // Esperar la respuesta del servidor antes de continuar
          const subscriptionResponse = await this.sendSubscriptionToServer(token).toPromise();
          console.log('Suscripción registrada en el servidor:', subscriptionResponse);
  
          console.log('Actualizando preferencias de comunicación...');
          await this.updateCommunicationPreferences(
            ['email', 'push'],
            {
              special_offers: true,
              event_reminders: true,
              news_updates: true,
              order_updates: true,
              urgent_orders: false,
              design_reviews: true,
              stock_alerts: false
            }
          ).toPromise();
          subscribed = true;
        } else {
          console.error('No se pudo obtener el token de FCM');
        }
      } else {
        console.log('Permiso denegado, actualizando preferencias sin push...');
        await this.updateCommunicationPreferences(
          ['email'],
          {
            special_offers: false,
            event_reminders: false,
            news_updates: false,
            order_updates: false,
            urgent_orders: false,
            design_reviews: false,
            stock_alerts: false
          }
        ).toPromise();
      }
  
      this.saveState(permission, true);
      return { permission, subscribed };
    } catch (error: any) {
      console.error('Error al solicitar permiso o suscribirse:', error);
      this.saveState(Notification.permission, true);
  
      // En caso de error, asegurar que las preferencias reflejen el estado actual
      await this.updateCommunicationPreferences(
        ['email'],
        {
          special_offers: false,
          event_reminders: false,
          news_updates: false,
          order_updates: false,
          urgent_orders: false,
          design_reviews: false,
          stock_alerts: false
        }
      ).toPromise();
  
      return { permission: Notification.permission, subscribed: false };
    }
  }

  // Método para verificar el estado de la suscripción push antes de incluir "push" en methods
  async getPushSubscriptionStatus(): Promise<boolean> {
    if (!this.isSupported()) return false;
  
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription; // Devuelve true si hay una suscripción activa en el navegador
    } catch (error) {
      console.error('Error al verificar suscripción push:', error);
      return false;
    }
  }

  // Desuscribirse de las notificaciones
  async unsubscribeFromPush(): Promise<void> {
    try {
      console.log('Desuscribiendo de notificaciones push...');
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker registrado para desuscribir:', registration);

      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: environment.vapidKey
      }).catch((error) => {
        console.error('Error al obtener token para desuscribir:', error);
        throw error;
      });

      if (token) {
        console.log('Eliminando token de FCM...');
        await deleteToken(messaging);
      }

      console.log('Eliminando suscripción del servidor...');
      await this.removeSubscriptionFromServer().toPromise();
      console.log('Actualizando preferencias sin push...');
      await this.updateCommunicationPreferences(
        ['email'],
        {
          special_offers: false,
          event_reminders: false,
          news_updates: false,
          order_updates: false,
          urgent_orders: false,
          design_reviews: false,
          stock_alerts: false
        }
      ).toPromise();
      this.saveState(Notification.permission, true);
    } catch (error: any) {
      console.error('Error al desuscribirse:', error);
      throw new Error(`Error al desuscribirse: ${error.message}`);
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

  // Obtener historial de notificaciones
  getNotificationHistory(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/history`, { headers, withCredentials: true });
      }),
      catchError((error: any) => {
        console.error('Error al obtener historial:', error);
        return throwError(() => new Error(`Error al obtener historial: ${error.message}`));
      })
    );
  }

  // Marcar notificación como vista
  markNotificationAsSeen(notificationId: number): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/mark-seen`, { notification_id: notificationId }, { headers, withCredentials: true });
      }),
      catchError((error: any) => {
        console.error('Error al marcar notificación:', error);
        return throwError(() => new Error(`Error al marcar notificación: ${error.message}`));
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