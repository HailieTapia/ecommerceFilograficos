import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() sidebarOpen: boolean = false;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  navItems = [
    { path: '/company', icon: 'fa-building', label: 'Empresa' },
    { path: '/dashboard-orders', icon: 'fa-building', label: 'Gestión de ordenes' },
    { path: '/banners', icon: 'fa-building', label: 'Banners' },
    { path: '/support-panel', icon: 'fa-headset', label: 'Soporte' },
    { path: '/faq-categories', icon: 'fa-list-ul', label: 'Categorías FAQ' },
    { path: '/faqs', icon: 'fa-question-circle', label: 'FAQs' },
    { path: '/security', icon: 'fa-shield-alt', label: 'Seguridad' },
    { path: '/type', icon: 'fa-tags', label: 'Tipos' },
    { path: '/template', icon: 'fa-file-alt', label: 'Plantillas' },
    { path: '/regulatory', icon: 'fa-balance-scale', label: 'Regulaciones' },
    { path: '/collaborators', icon: 'fa-users', label: 'Colaboradores' },
    { path: '/category', icon: 'fa-tags', label: 'Categorías' },
    { path: '/product-attributes', icon: 'fa-list-ul', label: 'Atributos de productos' },
    { path: '/product-catalog', icon: 'fa-box', label: 'Catálogo de productos' },
    { path: '/product-stock', icon: 'fa-warehouse', label: 'Inventario de productos' },
    { path: '/price-management', icon: 'fa-warehouse', label: 'Gestión de precios de productos' },
    { path: '/promotion-management', icon: 'fa-warehouse', label: 'Gestión de promociones' },
    { path: '/backup-management', icon: 'fa-warehouse', label: 'Gestión de respaldos' }
  ];
}