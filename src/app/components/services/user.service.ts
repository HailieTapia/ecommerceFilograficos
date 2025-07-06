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

    // Añadir una dirección al usuario 
    addAddress(data: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post(`${this.apiUrl}/users/add-address`, data, { headers, withCredentials: true });
            })
        );
    }

    // Actualizar solo la dirección del usuario
    updateUserProfile(address: any): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put(`${this.apiUrl}/users/change-address`, { address }, { headers, withCredentials: true });
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

    // Subir la foto de perfil del usuario
    uploadProfilePicture(file: File): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const formData = new FormData();
                formData.append('profilePicture', file);
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post(`${this.apiUrl}/users/upload-profile-picture`, formData, { headers, withCredentials: true });
            })
        );
    }

    // Eliminar la foto de perfil del usuario
    deleteProfilePicture(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.delete(`${this.apiUrl}/users/profile-picture`, { headers, withCredentials: true });
            })
        );
    }

    // Eliminar la cuenta del cliente autenticado
    deleteMyAccount(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.delete(`${this.apiUrl}/users/delete-account`, { headers, withCredentials: true });
            })
        );
    }
}