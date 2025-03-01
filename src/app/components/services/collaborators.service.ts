import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../environments/config';

@Injectable({
    providedIn: 'root'
})
export class CollaboratorsService {
    private apiUrl = `${environment.baseUrl}`;

    constructor(private csrfService: CsrfService, private http: HttpClient) { }

    //Crea un nuevo colaborador.
    createCollaborator(data: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post<any>(`${this.apiUrl}/collaborators`, data, { headers, withCredentials: true });
            })
        );
    }
    // Obtiene todos los colaboradores.
    getAllCollaborators(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get<any>(`${this.apiUrl}/collaborators`, { headers, withCredentials: true });
            })
        );
    }
    //Obtiene un colaborador por su ID.
    getCollaboratorById(id: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get<any>(`${this.apiUrl}/collaborators/${id}`, { headers, withCredentials: true });
            })
        );
    }

    //Actualiza un colaborador por ID.
    updateCollaborator(userId: string): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put<any>(`${this.apiUrl}/collaborators`, { userId }, { headers, withCredentials: true });
            })
        );
    }

    // Ruta para eliminar lógicamente colaboradores (solo administradores)
    deleteCollaborator(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.delete<any>(`${this.apiUrl}/company/delete`, { headers, withCredentials: true });
            })
        );
    }
}
