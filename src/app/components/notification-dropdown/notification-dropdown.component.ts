import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

// Definir una interfaz para las categorías del frontend
interface FrontendCategories {
  offers: boolean;
  events: boolean;
  news: boolean;
  orders: boolean;
  urgentOrders: boolean;
  designReviews: boolean;
  stockAlerts: boolean;
}

// Definir una interfaz para las categorías del backend
interface BackendCategories {
  special_offers: boolean;
  event_reminders: boolean;
  news_updates: boolean;
  order_updates: boolean;
  urgent_orders: boolean;
  design_reviews: boolean;
  stock_alerts: boolean;
}

// Definir una interfaz para las preferencias
interface Preferences {
  methods: string[];
  categories: BackendCategories;
  frontendCategories: FrontendCategories; // Para la interfaz de usuario
}

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.css']
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  isSupported: boolean = true;
  permissionState: string = 'default';
  hasPush: boolean = false;
  hasPrompted: boolean = false;
  showModal: boolean = false;
  loading: boolean = false;
  systemNotification: { type: string; message: string } | null = null;
  notifications: any[] = [];
  notificationError: string | null = null;
  isLoggedIn: boolean = false;
  userRole: string | null = null;
  preferences: Preferences = {
    methods: ['email'],
    categories: {
      special_offers: false,
      event_reminders: false,
      news_updates: false,
      order_updates: false,
      urgent_orders: false,
      design_reviews: false,
      stock_alerts: false
    },
    frontendCategories: {
      offers: false,
      events: false,
      news: false,
      orders: false,
      urgentOrders: false,
      designReviews: false,
      stockAlerts: false
    }
  };

  private userSubscription: Subscription | undefined;
  private loginSubscription: Subscription | undefined;
  private logoutSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

    if (this.isSupported) {
      this.notificationService.listenForMessages();
    }

    this.userSubscription = this.authService.getUser().subscribe(user => {
      this.isLoggedIn = !!user;
      this.userRole = user?.tipo || null;
      if (this.isLoggedIn) {
        this.handleLogin();
      } else {
        this.handleLogout();
      }
    });

    this.loginSubscription = this.authService.onLogin().subscribe(() => {
      this.handleLogin();
    });

    this.logoutSubscription = this.authService.onLogout().subscribe(() => {
      this.handleLogout();
    });
  }

  async handleLogin(): Promise<void> {
    if (this.isSupported) {
      const { permission, hasPush, hasPrompted } = await this.notificationService.checkNotificationStatus();
      this.permissionState = permission;
      this.hasPush = hasPush;
      this.hasPrompted = hasPrompted;

      if (!hasPrompted && this.permissionState === 'default') {
        await this.subscribeToPush();
      }

      this.loadPreferences();
      this.loadNotificationHistory();
    }
  }

  handleLogout(): void {
    this.hasPush = false;
    this.hasPrompted = false;
    this.notifications = [];
    this.preferences = {
      methods: ['email'],
      categories: {
        special_offers: false,
        event_reminders: false,
        news_updates: false,
        order_updates: false,
        urgent_orders: false,
        design_reviews: false,
        stock_alerts: false
      },
      frontendCategories: {
        offers: false,
        events: false,
        news: false,
        orders: false,
        urgentOrders: false,
        designReviews: false,
        stockAlerts: false
      }
    };
  }

  async loadPreferences(): Promise<void> {
    try {
      const response = await this.notificationService.getCommunicationPreferences().toPromise();
      const backendPreferences = response.preferences || { methods: ['email'], categories: {} };

      // Mapear las preferencias del backend a la estructura del componente
      this.preferences.methods = backendPreferences.methods || ['email'];
      this.hasPush = this.preferences.methods.includes('push');

      // Mapear categorías del backend a frontend
      this.preferences.categories = {
        special_offers: backendPreferences.categories.special_offers || false,
        event_reminders: backendPreferences.categories.event_reminders || false,
        news_updates: backendPreferences.categories.news_updates || false,
        order_updates: backendPreferences.categories.order_updates || false,
        urgent_orders: backendPreferences.categories.urgent_orders || false,
        design_reviews: backendPreferences.categories.design_reviews || false,
        stock_alerts: backendPreferences.categories.stock_alerts || false
      };
      this.mapBackendToFrontendCategories();
    } catch (error: any) {
      this.notificationError = error.message || 'Error al cargar preferencias';
      console.error('Error al cargar preferencias:', error);
    }
  }

  private mapBackendToFrontendCategories(): void {
    this.preferences.frontendCategories = {
      offers: this.preferences.categories.special_offers,
      events: this.preferences.categories.event_reminders,
      news: this.preferences.categories.news_updates,
      orders: this.preferences.categories.order_updates,
      urgentOrders: this.preferences.categories.urgent_orders,
      designReviews: this.preferences.categories.design_reviews,
      stockAlerts: this.preferences.categories.stock_alerts
    };
  }

  private mapFrontendToBackendCategories(): void {
    this.preferences.categories = {
      special_offers: this.preferences.frontendCategories.offers,
      event_reminders: this.preferences.frontendCategories.events,
      news_updates: this.preferences.frontendCategories.news,
      order_updates: this.preferences.frontendCategories.orders,
      urgent_orders: this.preferences.frontendCategories.urgentOrders,
      design_reviews: this.preferences.frontendCategories.designReviews,
      stock_alerts: this.preferences.frontendCategories.stockAlerts
    };
  }

  async loadNotificationHistory(): Promise<void> {
    try {
      const response = await this.notificationService.getNotificationHistory().toPromise();
      this.notifications = response.notifications || [];
    } catch (error: any) {
      this.notificationError = error.message || 'Error al cargar notificaciones';
    }
  }

  async subscribeToPush(): Promise<void> {
    try {
      this.notificationError = null;
      const { permission, subscribed } = await this.notificationService.requestPermissionAndSubscribe();
      this.permissionState = permission;
      this.hasPush = subscribed;
      this.hasPrompted = true;

      if (this.permissionState === 'granted' && subscribed) {
        this.preferences.methods = ['email', 'push'];
        this.updatePreferencesBasedOnRole();
        await this.updateCommunicationPreferences();
      } else {
        this.preferences.methods = ['email'];
        this.resetCategories();
        await this.updateCommunicationPreferences();
      }
    } catch (error: any) {
      this.notificationError = error.message || 'Error al activar notificaciones';
      this.preferences.methods = ['email'];
      this.resetCategories();
      await this.updateCommunicationPreferences();
    }
  }

  async unsubscribeFromPush(): Promise<void> {
    try {
      this.notificationError = null;
      await this.notificationService.unsubscribeFromPush();
      this.hasPush = false;
      this.preferences.methods = ['email'];
      this.resetCategories();
      await this.updateCommunicationPreferences();
    } catch (error: any) {
      this.notificationError = error.message || 'Error al desactivar notificaciones';
    }
  }

  async markAsSeen(notificationId: number): Promise<void> {
    try {
      await this.notificationService.markNotificationAsSeen(notificationId).toPromise();
      this.notifications = this.notifications.map(notif =>
        notif.notification_id === notificationId ? { ...notif, seen: true } : notif
      );
    } catch (error: any) {
      this.notificationError = error.message || 'Error al marcar notificación como vista';
    }
  }

  handleCategoryChange(category: keyof FrontendCategories): void {
    if (!this.hasPush && !this.preferences.frontendCategories[category]) {
      // Si se intenta activar una categoría y no hay push, activar push automáticamente
      this.subscribeToPush().then(() => {
        this.preferences.frontendCategories[category] = true;
        this.mapFrontendToBackendCategories();
        this.updateCommunicationPreferences();
      });
    } else {
      // Activar o desactivar la categoría normalmente
      this.preferences.frontendCategories[category] = !this.preferences.frontendCategories[category];
      this.mapFrontendToBackendCategories();

      // Verificar si todas las categorías están desactivadas para desactivar push
      const allCategoriesDisabled = Object.values(this.preferences.frontendCategories).every(value => !value);
      if (allCategoriesDisabled && this.hasPush) {
        this.unsubscribeFromPush();
      } else {
        this.updateCommunicationPreferences();
      }
    }
  }

  handlePushChange(): void {
    if (this.hasPush) {
      this.unsubscribeFromPush();
    } else {
      this.subscribeToPush();
      this.updatePreferencesBasedOnRole(); // Activar todas las categorías visibles al activar push
      this.updateCommunicationPreferences();
    }
  }

  async handleSave(): Promise<void> {
    this.loading = true;
    try {
      await this.updateCommunicationPreferences();
      this.loading = false;
      this.systemNotification = { type: 'success', message: 'Preferencias guardadas exitosamente' };
      this.showModal = false;
      setTimeout(() => {
        this.systemNotification = null;
      }, 3000);
    } catch (error: any) {
      this.loading = false;
      this.notificationError = error.message || 'Error al guardar preferencias';
    }
  }

  handleReset(): void {
    if (this.hasPush) {
      this.updatePreferencesBasedOnRole();
    } else {
      this.resetCategories();
    }
    this.mapFrontendToBackendCategories();
    this.updateCommunicationPreferences();
  }

  private updatePreferencesBasedOnRole(): void {
    this.preferences.methods = ['email', 'push'];
    if (this.userRole === 'administrador') {
      this.preferences.frontendCategories = {
        offers: false,
        events: false,
        news: false,
        orders: false,
        urgentOrders: true,
        designReviews: false,
        stockAlerts: true
      };
    } else {
      this.preferences.frontendCategories = {
        offers: true,
        events: true,
        news: true,
        orders: true,
        urgentOrders: false,
        designReviews: true,
        stockAlerts: false
      };
    }
    this.mapFrontendToBackendCategories();
  }

  private resetCategories(): void {
    this.preferences.frontendCategories = {
      offers: false,
      events: false,
      news: false,
      orders: false,
      urgentOrders: false,
      designReviews: false,
      stockAlerts: false
    };
    this.mapFrontendToBackendCategories();
  }

  private async updateCommunicationPreferences(): Promise<void> {
    await this.notificationService.updateCommunicationPreferences(
      this.preferences.methods,
      this.preferences.categories
    ).toPromise();
  }

  handleMarkAllAsRead(): void {
    const unreadIds = this.notifications.filter(n => !n.seen).map(n => n.notification_id);
    unreadIds.forEach(id => this.markAsSeen(id));
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.seen).length;
  }

  renderIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      special_offers: 'fa-tag',
      event_reminders: 'fa-calendar',
      news_updates: 'fa-newspaper',
      order_updates: 'fa-box',
      urgent_orders: 'fa-exclamation-triangle',
      design_reviews: 'fa-edit',
      stock_alerts: 'fa-warehouse'
    };
    return iconMap[category] || 'fa-bell';
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  getTimeRemaining(timestamp: string): string {
    const timeElapsed = Date.now() - new Date(timestamp).getTime();
    const timeRemaining = 24 * 60 * 60 * 1000 - timeElapsed;
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    return hoursRemaining > 0 ? `${hoursRemaining}h ${minutesRemaining}m` : `${minutesRemaining}m`;
  }

  ngOnDestroy(): void {
    if (this.userSubscription) this.userSubscription.unsubscribe();
    if (this.loginSubscription) this.loginSubscription.unsubscribe();
    if (this.logoutSubscription) this.logoutSubscription.unsubscribe();
  }
}