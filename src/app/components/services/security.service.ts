import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/config';
import { CsrfService } from './csrf.service';

@Injectable({
    providedIn: 'root'
})
export class SecurityService {
    private apiUrl = `${environment.baseUrl}`;

    constructor(private csrfService: CsrfService, private http: HttpClient) { }

    // Obtener intentos fallidos de inicio de sesión
    getFailedLoginAttempts(periodo: string): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                const params = new HttpParams().set('periodo', periodo);
                return this.http.get<any>(`${this.apiUrl}/security/failed-attempts`, { headers, params, withCredentials: true });
            })
        );
    }

    // Actualizar configuración de seguridad NO VERIFICADO
    updateTokenLifetime(data: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put(`${this.apiUrl}/security/update-token-lifetime`, data, { headers, withCredentials: true });
            })
        );
    }

    // Desbloquear usuario como administrador
    adminUnlockUser(user_id: string): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put(`${this.apiUrl}/security/unlock-user/${user_id}`, {}, { headers, withCredentials: true });
            })
        );
    }

    // Obtener configuración del sistema
    getConfig(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get<any>(`${this.apiUrl}/security/token-lifetime`, { headers, withCredentials: true });
            })
        );
    }
}
