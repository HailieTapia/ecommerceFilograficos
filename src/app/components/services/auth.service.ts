import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/config';
import { CsrfService } from './csrf.service';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.baseUrl}`;
  private userSubject = new BehaviorSubject<any>(null);

  constructor(private csrfService: CsrfService, private http: HttpClient) {
    this.loadUserFromStorage();  // Cargar usuario desde el LocalStorage cuando inicie el servicio
  }

  // Cargar usuario desde el localStorage al iniciar la aplicación
  private loadUserFromStorage() {
    const userData = localStorage.getItem('userData');
    if (userData) {
      this.userSubject.next(JSON.parse(userData));  // Establecer el usuario en el BehaviorSubject
    }
  }

  // Método para registrar al usuario
  register(userData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/auth/register`, userData, { headers, withCredentials: true });
      })
    );
  }

  // Método para logear al usuario
  login(loginData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/auth/login`, loginData, { headers, withCredentials: true });
      }),
      tap((user: any) => {
        // Imprimir en consola cada vez que el usuario se loguea
        console.log('Usuario logueado:', user);

        // Al hacer login, guarda la información del usuario en LocalStorage y actualiza el BehaviorSubject
        localStorage.setItem('userData', JSON.stringify(user));
        this.userSubject.next(user); // Almacena el usuario en el servicio
      })
    );
  }
  // Método para cerrar sesión
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
          catchError((error) => {
            console.error('Error al cerrar sesión:', error);
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
