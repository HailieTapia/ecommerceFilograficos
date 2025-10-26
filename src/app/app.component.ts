import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/public/footer/footer.component';
import { ToastComponent } from './components/administrator/shared/toast/toast.component';
import { SidebarComponent } from './components/header/sidebar/sidebar.component';
import { ThemeService } from './services/theme.service';
import { NotificationService } from './services/notification.service';
import { AuthService } from './services/auth.service';
import { CompanyService } from './services/company.service';
import { OfflineService } from './services/offline.service';
import { ToastService } from './services/toastService';
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
    SidebarComponent,
    RouterOutlet,
    RouterModule,
    CommonModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  userRole: string | null = null;
  logoPreview: string | ArrayBuffer | null = null;
  companyName: string | null = null;
  isSidebarOpen: boolean = true;
  isOnline: boolean = navigator.onLine; // Nueva propiedad para rastrear el estado
  private destroy$ = new Subject<void>();

  constructor(
    private themeService: ThemeService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private companyService: CompanyService,
    private offlineService: OfflineService,
    private toastService: ToastService
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

    // Suscribirse al estado de conexión
    this.offlineService.status$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isOnline: boolean) => {
        this.isOnline = isOnline; // Actualizar el estado
        this.toastService.showToast(
          isOnline ? 'Conexión restablecida' : 'Modo Offline: Sin conexión a internet',
          isOnline ? 'success' : 'warning'
        );
      });
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
        this.isSidebarOpen = true;
      },
      error: (err) => console.error('Error al cerrar sesión:', err)
    });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}