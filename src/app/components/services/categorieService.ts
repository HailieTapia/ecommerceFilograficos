import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../environments/config';

@Injectable({
  providedIn: 'root'
})
export class CategorieService {
  private apiUrl = `${environment.baseUrl}/categories`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  // Obtener todas las categorías
  getAllCategories(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<any>(`${this.apiUrl}`, { headers, withCredentials: true });
      })
    );
  }

  // Obtener una categoría por ID
  getCategoryById(id: number): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<any>(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
      })
    );
  }

  // Crear una nueva categoría
  createCategory(data: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post<any>(`${this.apiUrl}`, data, { headers, withCredentials: true });
      })
    );
  }

  // Actualizar categoría por ID
  updateCategory(id: number, data: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put<any>(`${this.apiUrl}/${id}`, data, { headers, withCredentials: true });
      })
    );
  }

  // Eliminar una categoría por ID
  deleteCategory(id: number): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
      })
    );
  }
}
