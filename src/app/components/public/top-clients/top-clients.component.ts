import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { ToastService } from '../../../services/toastService';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';
import { Observable, catchError, map, of } from 'rxjs';
import { Router } from '@angular/router';

// Interfaz para el objeto cliente VIP (basado en la respuesta del backend)
interface TopClient {
  user_id: number;
  customer_name: string;
  email: string;
  vip_level: 'Oro' | 'Plata';
  profile_picture_url: string | null;
  total_orders_completed: number;
  total_badges_obtained: number;
}

interface TopClientsResponse {
    message: string;
    topClients: TopClient[];
}

@Component({
  selector: 'app-top-clients',
  standalone: true,
  imports: [
    CommonModule, 
    SpinnerComponent
  ],
  templateUrl: './top-clients.component.html',
  styleUrl: './top-clients.component.css' // Puedes añadir un archivo CSS si lo necesitas
})
export class TopClientsComponent implements OnInit {
  
  public isLoading: boolean = false;
  public error: string | null = null;
  public topClients: TopClient[] = [];

  public oroClients: TopClient[] = [];
  public plataClients: TopClient[] = [];

  constructor(
    private userService: UserService, 
    private toastService: ToastService,
    private router: Router // Incluir Router por si deseas navegación futura
  ) {}

  ngOnInit(): void {
    this.loadTopClients();
  }

  loadTopClients(): void {
    this.isLoading = true;
    this.error = null;

    this.userService.getTopClients().subscribe({
      next: (response: TopClientsResponse) => {
        this.topClients = response.topClients || [];
        this.splitClientsByLevel(this.topClients);
        this.isLoading = false;
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error desconocido al conectar con el servidor.';
        this.error = errorMessage;
        this.toastService.showToast('No se pudieron cargar los Top Clientes.', 'error');
        this.isLoading = false;
      }
    });
  }

  private splitClientsByLevel(clients: TopClient[]): void {
    this.oroClients = clients.filter(c => c.vip_level === 'Oro');
    this.plataClients = clients.filter(c => c.vip_level === 'Plata');
  }
  
  // Utilidad para obtener las iniciales del cliente (copiada de tu ProfileComponent)
  getInitials(name: string | undefined | null): string {
    if (!name || name.trim() === '') return '?';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + (words[1] ? words[1][0] : words[0][1] || '')).toUpperCase();
  }
  
  // Función de seguimiento para la directiva ngFor
  trackByUserId(index: number, client: TopClient): number {
    return client.user_id;
  }
  
  onImgError(event: Event): void {
    (event.target as HTMLElement).style.display = 'none';
  }
}