import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
                return this.http.post(`${this.apiUrl}/regulatory/create`, data, { headers, withCredentials: true });
            })
        );
    }
    // Eliminar documento (lógico)
    deleteRegulatoryDocument(document_id: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.delete(`${this.apiUrl}/regulatory/delete-document/${document_id}`, { headers, withCredentials: true });
            })
        );
    }
    // Eliminar versión específica
    deleteRegulatoryDocumentVersion(document_id: number, version_id: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.delete(
                    `${this.apiUrl}/regulatory/delete/${document_id}/${version_id}`,
                    { headers, withCredentials: true }
                );
            })
        );
    }
    // Actualizar documento (nueva versión)
    updateRegulatoryDocument(document_id: number, data: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put(`${this.apiUrl}/regulatory/update/${document_id}`, data, { headers, withCredentials: true });
            })
        );
    }
    // Obtener todas las versiones Vigentes (Público)
    getAllCurrentVersions(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/regulatory/`, { headers, withCredentials: true });
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
    // Obtener historial de versiones
    getVersionHistory(document_id: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/regulatory/version-history/${document_id}`, { headers, withCredentials: true });
            })
        );
    }
    // Obtener documento por ID con todas sus versiones
    getDocumentById(document_id: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/regulatory/document/${document_id}`, { headers, withCredentials: true });
            })
        );
    }
    // Restaurar documento
    restoreRegulatoryDocument(document_id: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put(`${this.apiUrl}/regulatory/restore-document/${document_id}`, {}, { headers, withCredentials: true });
            })
        );
    }
    // Restaurar versión específica
    restoreRegulatoryDocumentVersion(document_id: number, version_id: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put(`${this.apiUrl}/regulatory/restore-version/${document_id}/${version_id}`, {}, { headers, withCredentials: true });
            })
        );
    }
}
