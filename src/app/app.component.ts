import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/public/footer/footer.component';
import { ToastComponent } from './components/administrator/shared/toast/toast.component';
import { ThemeService } from './components/services/theme.service';
import { NotificationService } from './components/services/notification.service';

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
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  constructor(
    private themeService: ThemeService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Registrar el Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then(registration => {
          console.log('Service Worker registrado con éxito:', registration);
          // Verificar el estado del Service Worker
          if (registration.active) {
            console.log('Service Worker activo:', registration.active.state);
          } else {
            console.log('Service Worker no está activo aún');
          }
        })
        .catch(error => {
          console.error('Error al registrar el Service Worker:', error);
        });
    } else {
      console.error('Service Worker no soportado en este navegador');
    }

    // Escuchar mensajes en primer plano
    this.notificationService.listenForMessages();
  }
}