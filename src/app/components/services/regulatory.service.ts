import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/config';
import { CsrfService } from './csrf.service';

@Injectable({
    providedIn: 'root'
})
export class TypeService {
    private apiUrl = `${environment.baseUrl}`;

    constructor(private csrfService: CsrfService, private http: HttpClient) { }

    // Crear nuevo documento regulatorio
    createRegulatoryDocument(data: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post(`${this.apiUrl}/users/profile`,data, { headers, withCredentials: true });
            })
        );
    }
    // Eliminar documento (lógico)
    deleteRegulatoryDocument(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.delete(`${this.apiUrl}/users/profile`, { headers, withCredentials: true });
            })
        );
    }
    // Eliminar versión específica
    deleteRegulatoryDocumentVersion(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.delete(`${this.apiUrl}/users/profile`, { headers, withCredentials: true });
            })
        );
    }
    // Actualizar documento (nueva versión)
    updateRegulatoryDocument(data: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put(`${this.apiUrl}/users/profile`, data,{ headers, withCredentials: true });
            })
        );
    }
    // Obtener todas las versiones vigentes
    getAllCurrentVersions(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/users/profile`, { headers, withCredentials: true });
            })
        );
    }

    // Obtener versión vigente de un documento
    getCurrentVersion(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/users/profile`, { headers, withCredentials: true });
            })
        );
    }

    // Obtener historial de versiones
    getVersionHistory(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/users/profile`, { headers, withCredentials: true });
            })
        );
    }

    // Obtener documento por ID con todas sus versiones
    getDocumentById(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/users/profile`, { headers, withCredentials: true });
            })
        );
    }

    // Restaurar documento
    restoreRegulatoryDocument(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/users/profile`, { headers, withCredentials: true });
            })
        );
    }

    // Restaurar versión específica
    restoreRegulatoryDocumentVersion(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/users/profile`, { headers, withCredentials: true });
            })
        );
    }
}
