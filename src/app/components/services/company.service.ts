import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../environments/config';

@Injectable({
    providedIn: 'root'
})
export class CompanyService {
    private apiUrl = `${environment.baseUrl}`;

    constructor(private csrfService: CsrfService, private http: HttpClient) { }
    
    // Obtener la información de la empresa
    getCompanyInfo(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get<any>(`${this.apiUrl}/company/`, {
                    headers,
                    withCredentials: true
                });
            })
        );
    }

    uploadCompanyLogo(file: File): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const formData = new FormData();
                formData.append('logo', file); // Agrega el archivo bajo el nombre "logo"

                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post<any>(`${this.apiUrl}/company/upload-logo`, formData, {
                    headers,
                    withCredentials: true
                });
            })
        );
    }
    
    // Actualizar la información existente de la empresa
    updateCompanyInfo(formData: FormData): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                // No establecer 'Content-Type' para que Angular lo maneje automáticamente
                return this.http.put<any>(`${this.apiUrl}/company/update`, formData, {
                    headers,
                    withCredentials: true
                });
            })
        );
    }

    // Eliminar enlaces de redes sociales
    deleteSocialMediaLinks(redesSociales: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put<any>(`${this.apiUrl}/company/delete-social-media-links`,
                    { redes_sociales: redesSociales },
                    { headers, withCredentials: true });
            })
        );
    }

    //NO SE OCUPA
    // Crear una nueva empresa
    createCompany(companyData: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post<any>(`${this.apiUrl}/company/create`, companyData, { headers, withCredentials: true });
            })
        );
    }

    // Borrar la empresa (marcarla como inactiva)
    deleteCompany(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post<any>(`${this.apiUrl}/company/delete`, {}, { headers, withCredentials: true });
            })
        );
    }

    // Restaurar la empresa (activar de nuevo)
    restoreCompany(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post<any>(`${this.apiUrl}/company/restore`, {}, { headers, withCredentials: true });
            })
        );
    }
}
