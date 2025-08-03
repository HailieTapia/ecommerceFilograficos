import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../environments/config';
import { CsrfService } from './csrf.service';

export interface ClientCluster {
    user_id: number;
    cluster: number;
    created_at: string;
    updated_at: string;
}
export interface ClusterGroup {
  clusterId: number;
  count: number;
  clients: ClientCluster[];
}

@Injectable({
    providedIn: 'root'
})
export class ClusterService {
    private apiUrl = `${environment.baseUrl}/client-cluster`;

    constructor(private csrfService: CsrfService, private http: HttpClient) { }

    setClientCluster(data: FormData): Observable<ClientCluster> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post<ClientCluster>(`${this.apiUrl}/`, data, { headers, withCredentials: true });
            })
        );
    }

    getAllClientClusters(): Observable<ClusterGroup[]> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get<ClusterGroup[]>(`${this.apiUrl}/`, { headers, withCredentials: true });
            })
        );
    }

    getClusterByUserId(id: number): Observable<ClientCluster> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get<ClientCluster>(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
            })
        );
    }
}