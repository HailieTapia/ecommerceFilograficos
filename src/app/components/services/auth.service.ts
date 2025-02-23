import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/config';
import { CsrfService } from './csrf.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.baseUrl}`;
  private userSubject = new BehaviorSubject<any>(null);

  constructor(private csrfService: CsrfService, private http: HttpClient) {
    this.loadUserFromStorage();
  }

  // Cargar usuario desde el localStorage al iniciar la aplicación
  private loadUserFromStorage() {
    const userData = localStorage.getItem('userData');
    if (userData) {
      this.userSubject.next(JSON.parse(userData));
    }
  }

  // Registro de usuarios
  register(data: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/auth/register`, data, { headers, withCredentials: true });
      })
    );
  }

  // Inicio de sesión
  login(data: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/auth/login`, data, { headers, withCredentials: true });
      }),
      tap((user: any) => {
        if (!user.mfaRequired) {
          localStorage.setItem('userData', JSON.stringify(user));
          this.userSubject.next(user);
        }
      })
    );
  }

  // Enviar OTP para MFA
  sendOtpMfa(userId: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/auth/mfa/send-otp`, { userId }, { headers, withCredentials: true });
      })
    );
  }

  // Verificar OTP para MFA
  verifyMfaOtp(userId: string, otp: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/auth/mfa/verify-otp`, { userId, otp }, { headers, withCredentials: true });
      }),
      tap((user: any) => {
        localStorage.setItem('userData', JSON.stringify(user));
        this.userSubject.next(user);
      })
    );
  }

  // Cerrar sesión del usuario (elimina el token de la sesión actual)
  logout(): Observable<any> {
    console.log('Cerrando sesión del usuario');
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/auth/logout`, {}, { headers, withCredentials: true }).pipe(
          tap(() => {
            localStorage.removeItem('userData'); // Eliminar el usuario del LocalStorage
            this.userSubject.next(null); // Resetear el estado del usuario
            console.log('Sesión cerrada exitosamente');
          }),
          catchError(error => {
            return throwError(() => new Error('No se pudo cerrar sesión.'));
          })
        );
      })
    );
  }

  // Método para obtener el usuario logueado
  getUser(): Observable<any> {
    return this.userSubject.asObservable(); // Permite obtener la información del usuario desde otros componentes
  }

  // En el AuthService
  resetAuthState(): void {
    localStorage.removeItem('userData'); // Eliminar el usuario del LocalStorage
    this.userSubject.next(null); // Resetear el estado del usuario
  }
  // Método para verificar si el usuario está logueado
  isLoggedIn(): boolean {
    return !!localStorage.getItem('userData'); // Verifica si hay un usuario logueado
  }

  // Método para obtener el tipo de usuario (rol) desde el usuario logueado
  getUserRole(): string | null {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData).user_type : null; // Retorna el tipo de usuario si está logueado
  }
}