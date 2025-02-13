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

    // obtener todos los tipos de email
    getAllEmailTypes(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/email-types`, { headers, withCredentials: true });
            })
        );
    }
    // Crear un nuevo tipo de email
    createEmailType(data: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post(`${this.apiUrl}/email-types`,data, { headers, withCredentials: true });
            })
        );
    }
}
