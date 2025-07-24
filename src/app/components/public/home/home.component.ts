import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ProductService } from '../../services/product.service';
import { BannerComponent } from '../banner/banner.component';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, BannerComponent, SpinnerComponent],
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
  private breakpointSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private productService: ProductService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    this.authService.getUser().subscribe(user => {
      this.user = user;
      if (user) {
        this.userService.getProfile().subscribe(
          profile => this.userProfile = profile,
          error => console.error('Error al obtener el perfil:', error)
        );
      } else {
        this.userProfile = null;
      }
    });

    this.loadHomeData();
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
      }
    });
  }

  ngOnDestroy() {
    this.dataSubscription?.unsubscribe();
    this.pollingSubscription?.unsubscribe();
    this.breakpointSubscription?.unsubscribe();
  }

  goToProductDetail(productId: number): void {
    this.router.navigate([`/collection/${productId}`]);
  }

  formatPrice(product: any): string {
    const minPrice = parseFloat(product.min_price) || 0;
    const maxPrice = parseFloat(product.max_price) || 0;
    return minPrice === maxPrice
      ? `$${minPrice.toFixed(2)}`
      : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
  }

  getStarRating(rating: string | number): { fullStars: number; halfStar: boolean; emptyStars: number } {
    const numericRating = parseFloat(rating as string) || 0;
    const fullStars = Math.floor(numericRating);
    const halfStar = numericRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return { fullStars, halfStar, emptyStars };
  }

  getFormattedRating(rating: string | number): string {
    const numericRating = parseFloat(rating as string) || 0;
    return numericRating.toFixed(1);
  }

  shouldShowRating(product: any): boolean {
    const numericRating = parseFloat(product.average_rating as string) || 0;
    return product.average_rating && numericRating > 0 && product.total_reviews > 0;
  }
}