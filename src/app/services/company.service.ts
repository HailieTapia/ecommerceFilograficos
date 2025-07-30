import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../environments/config';

@Injectable({
    providedIn: 'root'
})
export class CompanyService {
    private apiUrl = `${environment.baseUrl}/company`;

    // Biblioteca de íconos para redes sociales (usando FontAwesome como ejemplo)
    private socialMediaIcons: { [key: string]: string } = {
        'facebook': 'fab fa-facebook',
        'twitter': 'fab fa-twitter',
        'linkedin': 'fab fa-linkedin-in',
        'instagram': 'fab fa-instagram',
        'youtube': 'fab fa-youtube',
        'tiktok': 'fab fa-tiktok',
        'pinterest': 'fab fa-pinterest-p',
        'snapchat': 'fab fa-snapchat-ghost',
        'reddit': 'fab fa-reddit-alien',
        'tumblr': 'fab fa-tumblr',
        'whatsapp': 'fab fa-whatsapp',
        'telegram': 'fab fa-telegram-plane',
        'discord': 'fab fa-discord',
        'twitch': 'fab fa-twitch',
        'github': 'fab fa-github',
        'gitlab': 'fab fa-gitlab',
        'bitbucket': 'fab fa-bitbucket',
        'dribbble': 'fab fa-dribbble',
        'behance': 'fab fa-behance',
        'medium': 'fab fa-medium-m',
        'vimeo': 'fab fa-vimeo-v',
        'flickr': 'fab fa-flickr',
        'soundcloud': 'fab fa-soundcloud',
        'spotify': 'fab fa-spotify',
        'threads': 'fab fa-threads', // Si FontAwesome lo agrega en el futuro
        // Ícono genérico para redes no reconocidas
        'default': 'fas fa-globe'
    };

    constructor(private csrfService: CsrfService, private http: HttpClient) { }

    // Obtener el ícono de una red social según su nombre
    getSocialMediaIcon(socialMediaName: string): string {
        const name = socialMediaName.toLowerCase();
        return this.socialMediaIcons[name] || this.socialMediaIcons['default'];
    }

    // Crear una nueva empresa
    createCompany(data: FormData): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post<any>(`${this.apiUrl}/create`, data, { headers, withCredentials: true });
            })
        );
    }

    // Actualizar la información de la empresa
    updateCompany(data: FormData): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put<any>(`${this.apiUrl}/update`, data, { headers, withCredentials: true });
            })
        );
    }

    // Obtener la información de la empresa (público)
    getCompanyInfo(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.get<any>(`${this.apiUrl}`, { headers, withCredentials: true });
            })
        );
    }

    // Agregar una red social
    addSocialMedia(data: { name: string; link: string }): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post<any>(`${this.apiUrl}/social-media`, data, { headers, withCredentials: true });
            })
        );
    }

    // Actualizar una red social
    updateSocialMedia(data: { social_media_id: number; name?: string; link?: string }): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put<any>(`${this.apiUrl}/social-media`, data, { headers, withCredentials: true });
            })
        );
    }

    // Eliminar una red social (actualizado para usar parámetro en la URL)
    deleteSocialMedia(socialMediaId: number): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.delete<any>(`${this.apiUrl}/social-media/${socialMediaId}`, { headers, withCredentials: true });
            })
        );
    }

    // Eliminar lógicamente la empresa (solo administradores)
    deleteCompany(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.delete<any>(`${this.apiUrl}/delete`, { headers, withCredentials: true });
            })
        );
    }

    // Restaurar la empresa (solo administradores)
    restoreCompany(): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.put<any>(`${this.apiUrl}/restore`, {}, { headers, withCredentials: true });
            })
        );
    }
}