import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { CompanyService } from '../services/company.service';
import { ThemeService } from '../services/theme.service';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown.component';

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

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private authService: AuthService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
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
}