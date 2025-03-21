import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { CompanyService } from '../services/company.service';
import { ThemeService } from '../services/theme.service';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown.component';
import { CartService } from '../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationDropdownComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  userRole: string | null = null;
  isLoggedIn: boolean = false;
  company: any;
  sidebarOpen = false;
  logoPreview: string | ArrayBuffer | null = null;
  isProfileDropdownOpen = false; // Control para dropdown de perfil

  cartItemCount: number = 0;
  private cartSubscription!: Subscription; // Declaramos la propiedad aquí
  constructor(  

    private cartService: CartService,
    public themeService: ThemeService,
    private router: Router,
    private authService: AuthService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    // Suscribirse al estado del carrito
    this.cartSubscription = this.cartService.getCartState().subscribe(cartState => {
      this.cartItemCount = cartState.totalItems;
    });
    this.getCompanyInfo();
    this.authService.getUser().subscribe(user => {
      this.isLoggedIn = !!user;
      this.userRole = user?.tipo || null;
    });
  }

  // Función para alternar el estado del sidebar
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  // Obtener la información de la empresa
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
      next: () => this.router.navigate(['login']),
      error: (err) => console.error(err)
    });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  get isDarkMode() {
    return this.themeService.isDarkMode();
  }

  // Métodos para controlar el dropdown de perfil
  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  openProfileDropdown() {
    this.isProfileDropdownOpen = true;
  }

  closeProfileDropdown() {
    this.isProfileDropdownOpen = false;
  }
  ngOnDestroy() {
    // Desuscribirse para evitar memory leaks
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }
}