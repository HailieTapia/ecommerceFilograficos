import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { CompanyService } from '../services/company.service';
import { ThemeService } from '../services/theme.service';
import { CartService } from '../services/cart.service';
import { Subscription } from 'rxjs';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavigationComponent } from './navigation/navigation.component';
import { ProfileDropdownComponent } from './profile-dropdown/profile-dropdown.component';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown.component';
import { take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SidebarComponent,
    NavigationComponent,
    ProfileDropdownComponent,
    NotificationDropdownComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  userRole: string | null = null;
  userName: string | null = null;
  isLoggedIn: boolean = false;
  company: any;
  logoPreview: string | ArrayBuffer | null = null;
  cartItemCount: number = 0;
  mobileMenuOpen: boolean = false;
  searchTerm: string = '';
  private cartCountSubscription!: Subscription;

  constructor(
    private cartService: CartService,
    public themeService: ThemeService,
    private router: Router,
    private authService: AuthService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.cartCountSubscription = this.cartService.cartItemCount$.subscribe(
      (count) => {
        this.cartItemCount = count;
      }
    );
    this.getCompanyInfo();
    this.authService.getUser().subscribe(user => {
      this.isLoggedIn = !!user;
      this.userRole = user?.tipo || null;
      this.userName = user?.nombre ? this.formatUserName(user.nombre) : null; // Procesar el nombre
    });
  }

  ngOnDestroy(): void {
    if (this.cartCountSubscription) {
      this.cartCountSubscription.unsubscribe();
    }
  }

  getCompanyInfo(): void {
    this.companyService.getCompanyInfo().subscribe(
      (response) => {
        this.company = response.company;
        this.logoPreview = this.company.logo || null;
      },
      (error) => console.error('Error al obtener:', error)
    );
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.userName = null;
        this.router.navigate(['login']);
      },
      error: (err) => console.error(err)
    });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  get isDarkMode() {
    return this.themeService.isDarkMode();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkMobile();
  }

  private checkMobile(): void {
    if (!this.isMobile()) {
      this.mobileMenuOpen = false;
    }
  }

  private formatUserName(fullName: string): string {
    if (!fullName) return '';
    const nameParts = fullName.trim().split(/\s+/);
    return this.isMobile() ? nameParts[0].toUpperCase() : nameParts.slice(0, 2).join(' ').toUpperCase();
  }

  performSearch(): void {
    if (!this.searchTerm.trim() || this.userRole === 'administrador') {
      return;
    }
    this.authService.getUser().pipe(
      take(1),
      catchError(() => of(null))
    ).subscribe(user => {
      const route = user && user.tipo === 'cliente' ? '/authcatalog' : '/publiccatalog';
      this.router.navigate([route], { queryParams: { search: this.searchTerm.trim() }, queryParamsHandling: 'merge' });
      this.searchTerm = '';
    });
  }
}