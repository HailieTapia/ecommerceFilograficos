import { Component,OnInit  } from '@angular/core';
import { SessionService } from '../../services/session.service';
@Component({
  selector: 'app-session',
  standalone: true,
  imports: [],
  templateUrl: './session.component.html',
  styleUrl: './session.component.css'
})
export class SessionComponent implements OnInit {

  user: any = null;
  errorMessage: string = '';

  constructor(private sessionService: SessionService) {}

  ngOnInit(): void {
    
  }

  checkAuthentication(): void {
    this.sessionService.checkAuth().subscribe({
      next: (response) => {
        // Suponiendo que el backend retorna los datos del usuario:
        this.user = response;
      },
      error: (err) => {
        console.error('Error en la autenticación:', err);
        this.errorMessage = err.error?.message || 'Error al verificar la autenticación';
      }
    });
  }

  onRevokeTokens(): void {
    // Se debe obtener el userId; aquí se asume que viene en la propiedad user.userId
    if (!this.user || !this.user.userId) {
      console.error('No se encontró el identificador de usuario');
      return;
    }
    this.sessionService.revokeTokens(this.user.userId).subscribe({
      next: (response) => {
        console.log('Tokens revocados correctamente:', response);
        // Aquí podrías redirigir al login o realizar otra acción
      },
      error: (err) => {
        console.error('Error al revocar tokens:', err);
      }
    });
  }
}