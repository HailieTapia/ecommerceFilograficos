import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/config';
import { CsrfService } from './csrf.service';

@Injectable({
    providedIn: 'root'
})
export class TemplateService {
    private apiUrl = `${environment.baseUrl}`;

    constructor(private csrfService: CsrfService, private http: HttpClient) { }

    // Crear tipo de email(NO)
    createEmailTemplate(data: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post(`${this.apiUrl}/email-templates`, data, { headers, withCredentials: true });
            })
        );
    }
    // Obtener todas las plantillas activas
    getAllTemplates(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/email-templates`, { headers, withCredentials: true });
            })
        );
    }
    // Obtener plantilla por ID
    getEmailTemplateById(id: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/email-templates/${id}`, { headers, withCredentials: true });
            })
        );
    }
    // Actualizar plantilla de email(NO)
    updateEmailTemplate(id: number, data: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put(`${this.apiUrl}/email-templates/${id}`, data, { headers, withCredentials: true });
            })
        );
    }

    // Eliminación lógica(NO)
    deleteEmailTemplate(id: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.delete(`${this.apiUrl}/email-templates/${id}`, { headers, withCredentials: true });
            })
        );
    }
}
