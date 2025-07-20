import { Component, Input, Output, EventEmitter } from '@angular/core';
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
export class SidebarComponent {
  @Input() sidebarOpen: boolean = true;
  @Input() logoPreview: string | ArrayBuffer | null = null;
  @Input() companyName: string | null = null;
  @Output() toggleSidebarEvent = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  constructor(public themeService: ThemeService) {}

  sidebarItems = [
    { path: '/company', icon: 'fa-building', label: 'Empresa' },
    { path: '/dashboard-orders', icon: 'fa-shopping-cart', label: 'Gestión de ordenes' },
    { path: '/banners', icon: 'fa-image', label: 'Banners' },
    { path: '/support-panel', icon: 'fa-headset', label: 'Soporte' },
    { path: '/faq-categories', icon: 'fa-list-ul', label: 'Categorías FAQ' },
    { path: '/faqs', icon: 'fa-question-circle', label: 'FAQs' },
    { path: '/security', icon: 'fa-shield-alt', label: 'Seguridad' },
    { path: '/type', icon: 'fa-tags', label: 'Tipos' },
    { path: '/template', icon: 'fa-file-alt', label: 'Plantillas' },
    { path: '/regulatory', icon: 'fa-balance-scale', label: 'Regulaciones' },
    { path: '/collaborators', icon: 'fa-users', label: 'Colaboradores' },
    { path: '/category', icon: 'fa-folder', label: 'Categorías' },
    { path: '/product-attributes', icon: 'fa-cogs', label: 'Atributos de productos' },
    { path: '/product-catalog', icon: 'fa-box', label: 'Catálogo de productos' },
    { path: '/product-stock', icon: 'fa-warehouse', label: 'Inventario de productos' },
    { path: '/price-management', icon: 'fa-dollar-sign', label: 'Gestión de precios de productos' },
    { path: '/promotion-management', icon: 'fa-tag', label: 'Gestión de promociones' },
    { path: '/backup-management', icon: 'fa-database', label: 'Gestión de respaldos' }
  ];

  supportItems = [
    { icon: 'fa-question-circle', label: 'Help & Center', path: '/admin/help' },
    { icon: 'fa-cog', label: 'Settings', path: '/admin/settings' },
  ];

  toggleSidebar() {
    this.toggleSidebarEvent.emit();
  }

  onLogout() {
    this.logout.emit();
  }
}