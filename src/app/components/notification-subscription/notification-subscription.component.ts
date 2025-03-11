import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-subscription',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-subscription.component.html',
  styleUrls: ['./notification-subscription.component.css']
})
export class NotificationSubscriptionComponent implements OnInit, OnDestroy {
  isSupported: boolean = true;
  permissionState: string = 'default';
  isSubscribed: boolean = false;
  isLoggedIn: boolean = false;
  subscriptionError: string | null = null;
  private userSubscription: Subscription | undefined;
  private loginSubscription: Subscription | undefined;
  private logoutSubscription: Subscription | undefined;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Verificar soporte para notificaciones
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

    if (this.isSupported) {
      // Escuchar mensajes en primer plano
      this.notificationService.listenForMessages();

      // Verificar el estado inicial
      this.checkNotificationStatus();

      // Escuchar cambios en el estado de autenticación
      this.userSubscription = this.authService.getUser().subscribe(user => {
        this.isLoggedIn = !!user;
        if (this.isLoggedIn) {
          this.handleLogin();
        } else {
          this.handleLogout();
        }
      });

      // Escuchar eventos de login
      this.loginSubscription = this.authService.onLogin().subscribe(() => {
        this.handleLogin();
      });

      // Escuchar eventos de logout
      this.logoutSubscription = this.authService.onLogout().subscribe(() => {
        this.handleLogout();
      });
    }
  }

  private async checkNotificationStatus(): Promise<void> {
    const { permission, subscribed } = await this.notificationService.checkNotificationStatus();
    this.permissionState = permission;
    this.isSubscribed = subscribed;
  }

  private async handleLogin(): Promise<void> {
    await this.checkNotificationStatus();

    // Si el usuario nunca ha decidido, solicitar permiso
    if (this.permissionState === 'default') {
      this.subscribe();
    }
  }

  private handleLogout(): void {
    // No hacemos nada con las notificaciones al cerrar sesión
    // El estado se mantendrá en localStorage y se verificará al iniciar sesión nuevamente
  }

  async subscribe(): Promise<void> {
    try {
      this.subscriptionError = null;
      const { permission, subscribed } = await this.notificationService.requestPermissionAndSubscribe();
      this.permissionState = permission;
      this.isSubscribed = subscribed;
    } catch (error: any) {
      this.subscriptionError = error.message || 'Error al suscribirse a notificaciones';
      console.error('Subscription error:', error);
    }
  }

  async unsubscribe(): Promise<void> {
    try {
      this.subscriptionError = null;
      await this.notificationService.unsubscribeFromPush();
      this.isSubscribed = false;
    } catch (error: any) {
      this.subscriptionError = error.message || 'Error al desuscribirse de notificaciones';
      console.error('Unsubscribe error:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }
    if (this.logoutSubscription) {
      this.logoutSubscription.unsubscribe();
    }
  }
}