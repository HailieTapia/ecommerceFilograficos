import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../environments/config';
import { CsrfService } from './csrf.service';

@Injectable({
    providedIn: 'root'
})
export class ClusterService {
    private apiUrl = `${environment.baseUrl}/client-cluster`;

    constructor(private csrfService: CsrfService, private http: HttpClient) { }

    //  Asignar o actualizar el cluster de un cliente
    setClientCluster(data: FormData): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post<any>(`${this.apiUrl}/`, data, { headers, withCredentials: true });
            })
        );
    }

    //  Obtener todos los registros de clústeres
    getAllClientClusters(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/`, { headers, withCredentials: true });
            })
        );
    }

    // Obtener un clúster por user_id
    getClusterByUserId(id: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
            })
        );
    }
}
