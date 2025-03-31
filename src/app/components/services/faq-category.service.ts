import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../environments/config';

@Injectable({
  providedIn: 'root'
})
export class FaqCategoryService {
  private apiUrl = `${environment.baseUrl}/faq-categories`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  // Crear una nueva categoría de FAQ
  createCategory(categoryData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/`, categoryData, { headers, withCredentials: true });
      })
    );
  }

  // Obtener una categoría de FAQ por ID
  getCategoryById(id: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
      })
    );
  }

  // Obtener todas las categorías de FAQ activas con paginación y búsqueda
  getAllCategories(page: number = 1, pageSize: number = 10, search: string = ''): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        let params = new HttpParams()
          .set('page', page.toString())
          .set('pageSize', pageSize.toString());

        if (search) {
          params = params.set('search', search);
        }

        return this.http.get(`${this.apiUrl}/`, {
          headers,
          params,
          withCredentials: true,
        });
      })
    );
  }

  // Actualizar una categoría de FAQ
  updateCategory(id: string, updatedData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put(`${this.apiUrl}/${id}`, updatedData, { headers, withCredentials: true });
      })
    );
  }

  // Eliminar (lógicamente) una categoría de FAQ
  deleteCategory(id: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.delete(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
      })
    );
  }
}