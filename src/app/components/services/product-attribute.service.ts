import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../environments/config';

@Injectable({
  providedIn: 'root'
})
export class ProductAttributeService {
  private apiUrl = `${environment.baseUrl}/product-attributes`; // Ajustado a tu ruta base del backend

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  // Obtener la cantidad de atributos por categoría (requiere autenticación y rol de administrador)
  getAttributeCountByCategory(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/count-by-category`, { headers, withCredentials: true });
      })
    );
  }

  // Obtener todos los atributos de una categoría específica (requiere autenticación y rol de administrador)
  getAttributesByCategory(categoryId: string, page: number = 1, pageSize: number = 10): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const params = new HttpParams()
          .set('page', page.toString())
          .set('pageSize', pageSize.toString());
        return this.http.get(`${this.apiUrl}/by-category/${categoryId}`, { headers, params, withCredentials: true });
      })
    );
  }

  // Crear un nuevo atributo (requiere autenticación y rol de administrador)
  createAttribute(attributeData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/`, attributeData, { headers, withCredentials: true });
      })
    );
  }

  // Actualizar un atributo existente (requiere autenticación y rol de administrador)
  updateAttribute(id: string, attributeData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put(`${this.apiUrl}/${id}`, attributeData, { headers, withCredentials: true });
      })
    );
  }

  // Eliminar lógicamente un atributo (requiere autenticación y rol de administrador)
  deleteAttribute(id: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.delete(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
      })
    );
  }
}