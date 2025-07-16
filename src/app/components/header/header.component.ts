import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { CompanyService } from '../services/company.service';
import { ThemeService } from '../services/theme.service';
import { CartService } from '../services/cart.service';
import { Subscription } from 'rxjs';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ProfileDropdownComponent } from './profile-dropdown/profile-dropdown.component';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown.component';
import { NavigationComponent } from './navigation/navigation.component';
import { take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LoginComponent } from '../../components/public/login/login.component';
import { RegisterComponent } from '../../components/public/register/register.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    LoginComponent,
    RegisterComponent,
    CommonModule,
    RouterModule,
    FormsModule,
    SidebarComponent,
    ProfileDropdownComponent,
    NotificationDropdownComponent,
    NavigationComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  userRole: string | null = null;
  userName: string | null = null;
  profilePictureUrl: string | null = null;
  isLoggedIn: boolean = false;
  company: any;
  logoPreview: string | ArrayBuffer | null = null;
  cartItemCount: number = 0;
  searchTerm: string = '';
  showModal = false;
  showModal2 = false;

  private cartCountSubscription!: Subscription;

  constructor(
    private cartService: CartService,
    public themeService: ThemeService,
    private router: Router,
    private authService: AuthService,
    private companyService: CompanyService
  ) { }

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
      this.userName = user?.nombre ? this.formatUserName(user.nombre) : null;
      this.profilePictureUrl = user?.profilePictureUrl || null;
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
        this.profilePictureUrl = null;
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

  private formatUserName(fullName: string): string {
    if (!fullName) return '';
    const nameParts = fullName.trim().split(/\s+/);
    return nameParts.slice(0, 2).join(' ').toUpperCase();
  }
}