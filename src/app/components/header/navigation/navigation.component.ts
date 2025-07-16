import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent {
  navItems = [
    { path: '/', label: 'Inicio' },
    { path: '/product-categories', label: 'Categorías' },
    { path: '/offers', label: 'Ofertas' },
    { path: '/publiccatalog', label: 'CatalogoP' },
    { path: '/authcatalog', label: 'CatalogoA' },
    { path: '/help', label: 'Ayuda' }
  ];

  @Input() isLoggedIn: boolean = false;
  @Input() userRole: string | null = null;
}