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
  private loginSubject = new BehaviorSubject<void>(undefined);
  private logoutSubject = new BehaviorSubject<void>(undefined);

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
      tap((response: any) => {
        if (!response.mfaRequired) {
          const normalizedUser = { userId: response.userId, tipo: response.tipo };
          localStorage.setItem('userData', JSON.stringify(normalizedUser));
          this.userSubject.next(normalizedUser);
          this.loginSubject.next();
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
      tap((response: any) => {
        const normalizedUser = { userId: response.userId, tipo: response.tipo };
        localStorage.setItem('userData', JSON.stringify(normalizedUser));
        this.userSubject.next(normalizedUser);
        this.loginSubject.next();
      })
    );
  }

  // Cerrar sesión del usuario
  logout(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/auth/logout`, {}, { headers, withCredentials: true }).pipe(
          tap(() => {
            localStorage.removeItem('userData');
            this.userSubject.next(null);
            this.logoutSubject.next();
          }),
          catchError(error => {
            localStorage.removeItem('userData');
            this.userSubject.next(null);
            this.logoutSubject.next();
            return throwError(() => new Error('Error al cerrar sesión en el servidor'));
          })
        );
      })
    );
  }

  checkTokenStatus(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/users/profile`, { headers, withCredentials: true }).pipe(
          tap((response: any) => {
            const normalizedUser = {
              userId: response.user_id,
              tipo: response.user_type
            };
            localStorage.setItem('userData', JSON.stringify(normalizedUser));
            this.userSubject.next(normalizedUser);
          }),
          catchError(error => {
            if (error.status === 401 && !this.isLoggedIn()) {
              this.resetAuthState();
            }
            return throwError(() => error);
          })
        );
      })
    );
  }

  // Método para obtener el usuario logueado
  getUser(): Observable<any> {
    return this.userSubject.asObservable();
  }

  // Método para escuchar eventos de login
  onLogin(): Observable<void> {
    return this.loginSubject.asObservable();
  }

  // Método para escuchar eventos de logout
  onLogout(): Observable<void> {
    return this.logoutSubject.asObservable();
  }

  // Resetear el estado de autenticación
  resetAuthState(): void {
    localStorage.removeItem('userData');
    this.userSubject.next(null);
    this.logoutSubject.next();
  }

  // Verificar si el usuario está logueado
  isLoggedIn(): boolean {
    return !!localStorage.getItem('userData');
  }

  // Obtener el rol del usuario
  getUserRole(): string | null {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData).tipo : null;
  }
}