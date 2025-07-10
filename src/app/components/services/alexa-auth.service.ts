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
  private apiUrl = `${environment.baseUrl}/auth`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  /**
   * Completa la autorización de Alexa enviando los datos al backend
   * @param userId ID del usuario autenticado
   * @param redirectUri URI de redirección de Alexa
   * @param state Estado recibido de Alexa
   * @param scopes Scopes solicitados
   * @returns Observable con la URL de redirección
   */
  completeAuthorization(userId: number, redirectUri: string, state: string, scopes: string[] = environment.alexaScopes): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const body = {
          user_id: userId,
          redirect_uri: redirectUri,
          state,
          scope: scopes.join(' ')
        };
        return this.http.post(`${this.apiUrl}/alexa/complete-authorization`, body, { headers, withCredentials: true });
      }),
      catchError(error => {
        return throwError(() => new Error(`Error al completar la autorización de Alexa: ${error.error?.message || error.message}`));
      })
    );
  }

  /**
   * Valida si el redirectUri es válido
   * @param redirectUri URI de redirección a validar
   * @returns true si es válido, false si no
   */
  isValidRedirectUri(redirectUri: string): boolean {
    return environment.alexaRedirectUrls.includes(redirectUri);
  }

  /**
   * Valida si los scopes son soportados
   * @param scopes Scopes a validar
   * @returns true si todos los scopes son válidos, false si no
   */
  isValidScopes(scopes: string[]): boolean {
    return scopes.every(scope => environment.alexaScopes.includes(scope));
  }
}