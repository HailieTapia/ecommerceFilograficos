import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/config';
import { CsrfService } from './csrf.service';

@Injectable({
  providedIn: 'root'
})
export class AlexaAuthService {
  private apiUrl = `${environment.baseUrl}/auth/alexa-login`;
  private clientId = environment.clientId;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  login(email: string, password: string, redirectUri: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const body = {
          email,
          password,
          client_id: this.clientId,
          redirect_uri: redirectUri
        };
        return this.http.post(this.apiUrl, body, { headers, withCredentials: true });
      }),
      catchError(error => {
        let errorMessage = 'Error al iniciar sesión para Alexa';
        if (error.status === 401) {
          errorMessage = 'Credenciales incorrectas o cuenta no autorizada';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Datos proporcionados inválidos';
        } else if (error.status === 403) {
          errorMessage = error.error?.message || 'Acceso no autorizado';
        } else if (error.status === 429) {
          errorMessage = 'Demasiados intentos, intenta de nuevo más tarde';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}