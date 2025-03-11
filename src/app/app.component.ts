// src/app/app.component.ts
import { Component, OnInit } from '@angular/core'; // Añadimos OnInit
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/public/footer/footer.component';
import { ToastComponent } from './components/administrator/shared/toast/toast.component';
import { ThemeService } from './components/services/theme.service';
import { NotificationSubscriptionComponent } from './components/notification-subscription/notification-subscription.component'; // Importamos el componente
import { NotificationService } from './components/services/notification.service'; // Importamos el servicio

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ToastComponent,
    FooterComponent,
    HeaderComponent,
    RouterOutlet,
    RouterModule,
    CommonModule,
    NotificationSubscriptionComponent // Añadimos el componente aquí
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  constructor(
    private themeService: ThemeService,
    private notificationService: NotificationService // Inyectamos el servicio
  ) {}

  ngOnInit(): void {
    // Registrar el Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then(registration => {
          console.log('Service Worker registrado con éxito:', registration);
        })
        .catch(error => {
          console.error('Error al registrar el Service Worker:', error);
        });
    }

    // Escuchar mensajes en primer plano
    this.notificationService.listenForMessages();
  }
}