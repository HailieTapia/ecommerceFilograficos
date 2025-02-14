import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../environments/config';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private apiUrl = `${environment.baseUrl}`;

    constructor(private csrfService: CsrfService, private http: HttpClient) { }

    // Actualización del perfil del usuario (nombre, dirección, teléfono)
    updateProfile(data: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put(`${this.apiUrl}/users/profile`, data, { headers, withCredentials: true });
            })
        );
    }

    //Añadir una dirección al usuario 
    addAddress(data: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post(`${this.apiUrl}/users/add-address`, data, { headers, withCredentials: true });
            })
        );
    }

    // Actualizar solo la dirección del usuario
    updateUserProfile(direccion: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put(`${this.apiUrl}/users/change-address`, { direccion }, { headers, withCredentials: true });
            })
        );
    }

    // Función para obtener el perfil del usuario autenticado
    getProfile(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get(`${this.apiUrl}/users/profile`, { headers, withCredentials: true });
            })
        );
    }

    // Eliminar la cuenta del cliente autenticado(NO)
    deleteMyAccount(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.delete(`${this.apiUrl}/users/delete-account`, { headers, withCredentials: true })
            })
        );
    }
}