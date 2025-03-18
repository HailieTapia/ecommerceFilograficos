import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  user: any = null;
  userProfile: any = null; // Para almacenar los datos del perfil

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.authService.getUser().subscribe(user => {
      this.user = user;
      if (user) {
        // Si hay un usuario autenticado, obtener el perfil completo
        this.userService.getProfile().subscribe(
          profile => {
            this.userProfile = profile; // Almacenar el perfil
          },
          error => {
            console.error('Error al obtener el perfil:', error);
          }
        );
      } else {
        this.userProfile = null; // Limpiar el perfil si no hay usuario
      }
    });
  }

  get isAuthenticated(): boolean {
    return !!this.user;
  }

  get isClient(): boolean {
    return this.user && this.user.tipo === 'cliente';
  }
}