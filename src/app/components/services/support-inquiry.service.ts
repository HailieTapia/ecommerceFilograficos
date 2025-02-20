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

  // Obtener el número total de consultas por cada estado (requiere autenticación y rol de administrador)
  getConsultationCountsByStatus(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/counts-by-status`, { headers, withCredentials: true });
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

  // Añadir estas funciones al servicio
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'in_progress': 'En Proceso',
      'resolved': 'Resuelto',
      'closed': 'Cerrado'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'resolved': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return `${classes[status]} px-2 py-1 rounded-full text-sm`;
  }

  isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: { [key: string]: string[] } = {
      pending: ['in_progress', 'resolved', 'closed'], // Puede avanzar a cualquier estado
      in_progress: ['resolved', 'closed'], // No puede volver a 'pending'
      resolved: ['closed'], // No puede volver a 'pending' o 'in_progress'
      closed: [] // No puede cambiar de estado
    };
  
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }  
}