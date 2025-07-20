import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/public/footer/footer.component';
import { ToastComponent } from './components/administrator/shared/toast/toast.component';
import { SidebarComponent } from '../app/components/header/sidebar/sidebar.component'; // Importa el SidebarComponent
import { ThemeService } from './components/services/theme.service';
import { NotificationService } from './components/services/notification.service';
import { AuthService } from './components/services/auth.service'; // Importa el AuthService
import { CompanyService } from './components/services/company.service'; // Importa el CompanyService
import { Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ToastComponent,
    FooterComponent,
    HeaderComponent,
    SidebarComponent, // Agrega el SidebarComponent
    RouterOutlet,
    RouterModule,
    CommonModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  isLoggedIn: boolean = false;
  userRole: string | null = null;
  logoPreview: string | ArrayBuffer | null = null;
  companyName: string | null = null;
  isSidebarOpen: boolean = true; // Controla el estado del sidebar
  private destroy$ = new Subject<void>();

  constructor(
    private themeService: ThemeService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    // Registrar el Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then(registration => {
          console.log('Service Worker registrado con éxito:', registration);
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

    // Obtener información del usuario
    this.authService.getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn = !!user;
        this.userRole = user?.tipo || null;
      });

    // Obtener información de la compañía
    this.companyService.getCompanyInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        response => {
          this.companyName = response.company?.name || null;
          this.logoPreview = response.company?.logo || null;
        },
        error => console.error('Error al obtener información de la compañía:', error)
      );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.isLoggedIn = false;
        this.userRole = null;
        this.isSidebarOpen = true; // Restablecer el estado del sidebar
      },
      error: (err) => console.error('Error al cerrar sesión:', err)
    });
  }
}