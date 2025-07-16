import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ProductService } from '../../services/product.service';
import { BannerComponent } from '../banner/banner.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, BannerComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  user: any = null;
  userProfile: any = null;
  featuredProducts: any[] = [];
  recentProducts: any[] = [];
  topSellingProducts: any[] = [];
  errorMessage: string | null = null;
  private dataSubscription: Subscription | null = null;
  private pollingSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private productService: ProductService
  ) {}

  ngOnInit() {
    // Cargar datos de usuario y perfil (lógica existente)
    this.authService.getUser().subscribe(user => {
      this.user = user;
      if (user) {
        this.userService.getProfile().subscribe(
          profile => {
            this.userProfile = profile;
          },
          error => {
            console.error('Error al obtener el perfil:', error);
          }
        );
      } else {
        this.userProfile = null;
      }
    });

    // Carga inicial de datos del home (usando caché si está disponible)
    this.loadHomeData();
    // Iniciar polling cada hora
    this.startPolling();
  }

  private loadHomeData() {
    this.dataSubscription = this.productService.getHomeData(false).subscribe({
      next: (response: any) => {
        this.featuredProducts = response.data.featuredProducts || [];
        this.recentProducts = response.data.recentProducts || [];
        this.topSellingProducts = response.data.topSellingProducts || [];
        this.errorMessage = null;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar los datos del home. Por favor, intenta de nuevo más tarde.';
        console.error('Error en loadHomeData:', error);
        this.featuredProducts = [];
        this.recentProducts = [];
        this.topSellingProducts = [];
      }
    });
  }

  private startPolling() {
    this.pollingSubscription = this.productService.getHomeData(true).subscribe({
      next: (response: any) => {
        this.featuredProducts = response.data.featuredProducts || [];
        this.recentProducts = response.data.recentProducts || [];
        this.topSellingProducts = response.data.topSellingProducts || [];
        this.errorMessage = null;
      },
      error: (error) => {
        console.error('Error en polling:', error);
        // No actualizamos errorMessage para no interrumpir la UX si falla el polling
      }
    });
  }

  ngOnDestroy() {
    // Cancelar suscripciones para evitar fugas de memoria
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  get isAuthenticated(): boolean {
    return !!this.user;
  }

  get isClient(): boolean {
    return this.user && this.user.tipo === 'cliente';
  }
}