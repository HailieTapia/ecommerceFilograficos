import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/config';
import { CsrfService } from './csrf.service';

@Injectable({
    providedIn: 'root'
})
export class IncidenceService {
    private apiUrl = `${environment.baseUrl}`;

    constructor(private csrfService: CsrfService, private http: HttpClient) { }

    // Obtener configuración existente
    getConfig(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get<any>(`${this.apiUrl}/security/token-lifetime`,
                    { headers, withCredentials: true }
                );
            })
        );
    }
    // Obtener intentos fallidos de inicio de sesión
    getFailedLoginAttempts(periodo: string): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                const params = new HttpParams().set('periodo', periodo);
                return this.http.get<any>(`${this.apiUrl}/security/failed-attempts`, {
                    headers,
                    params,
                    withCredentials: true
                });
            })
        );
    }
}
