// src/app/components/notification-subscription/notification-subscription.component.ts
import { Component, OnInit } from '@angular/core';
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
export class NotificationSubscriptionComponent implements OnInit {
  isSubscribed = false;
  subscriptionError: string | null = null;
  private userSubscription: Subscription | undefined;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkSubscriptionStatus();
    this.userSubscription = this.authService.getUser().subscribe(user => {
      // Reactivar si necesitas actualizar el estado con cambios de usuario
    });
  }

  async checkSubscriptionStatus(): Promise<void> {
    this.isSubscribed = await this.notificationService.isSubscribed();
  }

  async subscribeToNotifications(): Promise<void> {
    try {
      this.subscriptionError = null;

      this.authService.getUser().subscribe(user => {
        const userId = user?.userId; // Cambiado a userId para coincidir con localStorage
        if (!userId) {
          this.subscriptionError = 'Debes iniciar sesión para suscribirte';
          return;
        }

        this.notificationService.subscribeToPush(userId).then(() => {
          this.isSubscribed = true;
        }).catch(error => {
          this.subscriptionError = error.message || 'Error al suscribirse a notificaciones';
          console.error('Subscription error:', error);
        });
      });
    } catch (error: any) {
      this.subscriptionError = error.message || 'Error al suscribirse a notificaciones';
      console.error('Subscription error:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}