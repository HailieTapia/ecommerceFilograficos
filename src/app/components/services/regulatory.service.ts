import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/config';
import { CsrfService } from './csrf.service';

@Injectable({
    providedIn: 'root'
})
export class RegulatoryService {
    private apiUrl = `${environment.baseUrl}`;

    constructor(private csrfService: CsrfService, private http: HttpClient) { }

    // Crear nuevo documento regulatorio YAAAAAA
    createRegulatoryDocument(data: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post(`${this.apiUrl}/regulatory/create`, data, { headers, withCredentials: true });
            })
        );
    }
    // Eliminar documento (lógico) YAAAAAAAAAAA
    deleteRegulatoryDocument(id: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.delete(`${this.apiUrl}/regulatory/delete-document/${id}`, { headers, withCredentials: true });
            })
        );
    }
    // Eliminar versión específica 
    deleteRegulatoryDocumentVersion(id: number, version_id: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.delete(`${this.apiUrl}/regulatory/delete/${id}/${version_id}`,{ headers, withCredentials: true });
            })
        );
    }
    // Actualizar documento (nueva versión) YAAAAAAAAA
    updateRegulatoryDocument(id: number, data: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put(`${this.apiUrl}/regulatory/update/${id}`, data, { headers, withCredentials: true });
            })
        );
    }
    // Obtener todas las versiones Vigentes (Público) YAAAAAAAAA
    getAllCurrentVersions(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/regulatory`, { headers, withCredentials: true });
            })
        );
    }
    // Obtener versión vigente de un documento/por Título (Público)
    getCurrentVersion(title: string): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/regulatory/${title}`, { headers, withCredentials: true });
            })
        );
    }
    // Obtener historial de versiones YAAAAAAAA
    getVersionHistory(id: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/regulatory/version-history/${id}`, { headers, withCredentials: true });
            })
        );
    }
    // Obtener documento por ID con todas sus versiones
    getDocumentById(id: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/regulatory/document/${id}`, { headers, withCredentials: true });
            })
        );
    }
    // Restaurar documento NO LAS VEO 
    restoreRegulatoryDocument(id: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put(`${this.apiUrl}/regulatory/restore-document/${id}`, {}, { headers, withCredentials: true });
            })
        );
    }
    // Restaurar versión específica NO SE HACE
    restoreRegulatoryDocumentVersion(id: number, version_id: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put(`${this.apiUrl}/regulatory/restore-version/${id}/${version_id}`, {}, { headers, withCredentials: true });
            })
        );
    }
}
