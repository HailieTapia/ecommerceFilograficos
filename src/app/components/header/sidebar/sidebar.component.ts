import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';

// Definir una interfaz para las traducciones
interface Translations {
  [key: string]: string;
}

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

  // Agrupación de ítems en categorías colapsables
  sidebarCategories = [
    {
      label: 'General',
      collapsed: false,
      items: [
        { path: '/admin-dashboard', icon: 'fa-home', label: 'Home', badge: null },
        { path: '/company', icon: 'fa-building', label: 'Empresa', badge: null },
        { path: '/dashboard-orders', icon: 'fa-shopping-cart', label: 'Gestión de órdenes', badge: '4' }
      ]
    },
    {
      label: 'Contenido',
      collapsed: true,
      items: [
        { path: '/banners', icon: 'fa-images', label: 'Banners', badge: null },
        { path: '/faqs', icon: 'fa-question-circle', label: 'FAQs', badge: null },
        { path: '/faq-categories', icon: 'fa-clipboard-question', label: 'Categorías FAQ', badge: null },
        { path: '/badge-categories', icon: 'fa-clipboard-question', label: 'Categorías de Insignias', badge: null },
      ]
    },
    {
      label: 'Productos',
      collapsed: true,
      items: [
        { path: '/category', icon: 'fa-folder-tree', label: 'Categorías', badge: null },
        { path: '/product-attributes', icon: 'fa-cogs', label: 'Atributos de productos', badge: null },
        { path: '/product-catalog', icon: 'fa-box', label: 'Catálogo de productos', badge: null },
        { path: '/product-stock', icon: 'fa-warehouse', label: 'Inventario de productos', badge: null },
        { path: '/price-management', icon: 'fa-dollar-sign', label: 'Gestión de precios de productos', badge: null },
        { path: '/promotion-management', icon: 'fa-tag', label: 'Gestión de promociones', badge: null },
        { path: '/clusters', icon: 'fa-tag', label: 'Gestión de cupones', badge: null }
      ]
    },
    {
      label: 'Configuración',
      collapsed: true,
      items: [
        { path: '/support-panel', icon: 'fa-headset', label: 'Panel de Soporte', badge: null },
        { path: '/security', icon: 'fa-shield-alt', label: 'Seguridad', badge: null },
        { path: '/type', icon: 'fa-inbox', label: 'Tipos', badge: null },
        { path: '/template', icon: 'fa-file-alt', label: 'Plantillas', badge: null },
        { path: '/regulatory', icon: 'fa-gavel', label: 'Regulaciones', badge: null },
        { path: '/collaborators', icon: 'fa-users', label: 'Colaboradores', badge: null },
        { path: '/backup-management', icon: ' fa-cloud-upload-alt', label: 'Gestión de respaldos', badge: null }
      ]
    }
  ];

  supportItems = [
    { icon: 'fa-question-circle', label: 'Help & Center', path: '/admin/help' },
    { icon: 'fa-cog', label: 'Settings', path: '/admin/settings' }
  ];

  // Traducciones con tipificación explícita
  translations: Translations = {
    'Home': 'Inicio',
    'Empresa': 'Empresa',
    'Gestión de órdenes': 'Gestión de órdenes',
    'Banners': 'Banners',
    'Categorías FAQ': 'Categorías FAQ',
    'FAQs': 'FAQs',
    'Seguridad': 'Seguridad',
    'Tipos': 'Tipos',
    'Plantillas': 'Plantillas',
    'Regulaciones': 'Regulaciones',
    'Colaboradores': 'Colaboradores',
    'Categorías': 'Categorías',
    'Atributos de productos': 'Atributos de productos',
    'Catálogo de productos': 'Catálogo de productos',
    'Inventario de productos': 'Inventario de productos',
    'Gestión de precios de productos': 'Gestión de precios',
    'Gestión de promociones': 'Gestión de promociones',
    'Gestión de respaldos': 'Gestión de respaldos',
    'Help & Center': 'Ayuda y Soporte',
    'Settings': 'Configuraciones',
    'Cerrar Sesión': 'Cerrar Sesión',
    'Panel Administrativo': 'Panel Administrativo',
    'Filográficos': 'Filográficos',
    'General': 'General',
    'Contenido': 'Contenido',
    'Productos': 'Productos',
    'Configuración': 'Configuración',
    'Panel de Soporte':'Panel de Soporte'
  };

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

  toggleCategory(category: any): void {
    category.collapsed = !category.collapsed;
  }

  onLogout(): void {
    this.logout.emit();
  }

  getTranslatedLabel(label: string): string {
    return this.translations[label] || label;
  }
}