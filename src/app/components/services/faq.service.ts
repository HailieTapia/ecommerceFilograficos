import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../environments/config';

@Injectable({
  providedIn: 'root'
})
export class FaqService {
  private apiUrl = `${environment.baseUrl}/faq`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  // Crear una nueva pregunta frecuente
  createFaq(faqData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/`, faqData, { headers, withCredentials: true });
      })
    );
  }

  // Obtener una pregunta frecuente por ID
  getFaqById(id: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
      })
    );
  }

  // Obtener todas las preguntas frecuentes activas
  getAllFaqs(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/`, { headers, withCredentials: true });
      })
    );
  }

// Buscar preguntas frecuentes por término de búsqueda
  searchFaqs(query: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const encodedQuery = encodeURIComponent(query.trim()); // Codificar la consulta
        return this.http.get(`${this.apiUrl}/search?q=${encodedQuery}`, { headers, withCredentials: true });
      })
    );
  }

  // Actualizar una pregunta frecuente
  updateFaq(id: number, updatedData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put(`${this.apiUrl}/${id}`, updatedData, { headers, withCredentials: true });
      })
    );
  }

  // Eliminar (lógicamente) una pregunta frecuente
  deleteFaq(id: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.delete(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
      })
    );
  }
}
