import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() sidebarOpen: boolean = true;
  @Input() logoPreview: string | ArrayBuffer | null = null;
  @Input() companyName: string | null = null;
  @Output() toggleSidebarEvent = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  isMobile: boolean = false;

  sidebarItems = [
    { path: '/dashboard', icon: 'fa-home', label: 'Home', active: false },
    { path: '/company', icon: 'fa-building', label: 'Empresa', active: true },
    { path: '/dashboard-orders', icon: 'fa-shopping-cart', label: 'Gestión de ordenes', active: false, badge: '4' },
    { path: '/banners', icon: 'fa-image', label: 'Banners', active: false },
    { path: '/support-panel', icon: 'fa-headset', label: 'Soporte', active: false },
    { path: '/faq-categories', icon: 'fa-list-ul', label: 'Categorías FAQ', active: false },
    { path: '/faqs', icon: 'fa-question-circle', label: 'FAQs', active: false },
    { path: '/security', icon: 'fa-shield-alt', label: 'Seguridad', active: false },
    { path: '/type', icon: 'fa-tags', label: 'Tipos', active: false },
    { path: '/template', icon: 'fa-file-alt', label: 'Plantillas', active: false },
    { path: '/regulatory', icon: 'fa-balance-scale', label: 'Regulaciones', active: false },
    { path: '/collaborators', icon: 'fa-users', label: 'Colaboradores', active: false },
    { path: '/category', icon: 'fa-folder', label: 'Categorías', active: false },
    { path: '/product-attributes', icon: 'fa-cogs', label: 'Atributos de productos', active: false },
    { path: '/product-catalog', icon: 'fa-box', label: 'Catálogo de productos', active: false },
    { path: '/product-stock', icon: 'fa-warehouse', label: 'Inventario de productos', active: false },
    { path: '/price-management', icon: 'fa-dollar-sign', label: 'Gestión de precios de productos', active: false },
    { path: '/promotion-management', icon: 'fa-tag', label: 'Gestión de promociones', active: false },
    { path: '/backup-management', icon: 'fa-database', label: 'Gestión de respaldos', active: false }
  ];

  supportItems = [
    { icon: 'fa-question-circle', label: 'Help & Center', path: '/admin/help' },
    { icon: 'fa-cog', label: 'Settings', path: '/admin/settings' },
  ];

  constructor(public themeService: ThemeService) {}

  ngOnInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
  }

  toggleSidebar(): void {
    this.toggleSidebarEvent.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }
}