import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service'; // Ajusta la ruta según tu estructura

@Component({
  selector: 'app-administrator-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink], // Importamos módulos necesarios
  templateUrl: './administrator-dashboard.component.html',
  styleUrls: ['./administrator-dashboard.component.css']
})
export class AdministratorDashboardComponent implements OnInit {
  adminName: string | null = null;
  stats = {
    users: 0,
    products: 0,
    orders: 0
  };
  notifications: { message: string }[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Obtener información del administrador
    this.authService.getUser().subscribe(user => {
      this.adminName = user?.name || 'Administrador';
    });

    // Simulación de datos (reemplaza con servicios reales)
    this.loadStats();
    this.loadNotifications();
  }

  loadStats(): void {
    // Aquí iría la lógica para cargar estadísticas desde un servicio
    this.stats = {
      users: 150,    // Ejemplo
      products: 300, // Ejemplo
      orders: 25     // Ejemplo
    };
  }

  loadNotifications(): void {
    // Aquí iría la lógica para cargar notificaciones desde un servicio
    this.notifications = [
      { message: 'Nuevo pedido #1234 pendiente de revisión' },
      { message: 'Usuario reportó un problema con el producto XYZ' }
    ];
  }
}