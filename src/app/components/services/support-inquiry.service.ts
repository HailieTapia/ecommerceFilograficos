import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../environments/config';

@Injectable({
  providedIn: 'root'
})
export class SupportInquiryService {
  private apiUrl = `${environment.baseUrl}/support-inquiry`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  // Crear una nueva consulta de soporte
  createConsultation(consultationData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/`, consultationData, { headers, withCredentials: true });
      })
    );
  }

  // Obtener todas las consultas de soporte (requiere autenticación y rol de administrador)
  getAllConsultations(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/`, { headers, withCredentials: true });
      })
    );
  }

  // Obtener una consulta específica por ID (requiere autenticación)
  getConsultationById(id: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
      })
    );
  }

  // Actualizar el estado de una consulta por ID (requiere autenticación y rol de administrador)
  updateConsultationStatus(id: string, statusData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put(`${this.apiUrl}/update-status/${id}`, statusData, { headers, withCredentials: true });
      })
    );
  }

  // Actualizar el canal de contacto de una consulta por ID (requiere autenticación y rol de administrador)
  updateConsultationContactChannel(id: string, contactChannelData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put(`${this.apiUrl}/update-contact-channel/${id}`, contactChannelData, { headers, withCredentials: true });
      })
    );
  }

  // Actualizar el canal de respuesta de una consulta por ID (requiere autenticación y rol de administrador)
  updateConsultationResponseChannel(id: string, responseChannelData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put(`${this.apiUrl}/update-response-channel/${id}`, responseChannelData, { headers, withCredentials: true });
      })
    );
  }
}