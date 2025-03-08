import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../environments/config';

@Injectable({
  providedIn: 'root'
})
export class CategorieService {
  private apiUrl = `${environment.baseUrl}/categories`;

  constructor(private csrfService: CsrfService, private http: HttpClient) { }

  // Obtener todas las categorías con paginación
  getAllCategories(
    page: number = 1,
    pageSize: number = 10,
    active?: boolean, // Opcional: true (activas), false (desactivadas), undefined (todas)
    name?: string,    // Opcional: filtro por nombre
    sortBy?: string,  // Opcional: campo para ordenar (en este caso solo 'name')
    sortOrder?: 'ASC' | 'DESC' // Opcional: dirección del ordenamiento
  ): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        let params = new HttpParams()
          .set('page', page.toString())
          .set('pageSize', pageSize.toString());

        // Agregar parámetros opcionales si están definidos
        if (active !== undefined) {
          params = params.set('active', active.toString());
        }
        if (name) {
          params = params.set('name', name);
        }
        if (sortBy) {
          params = params.set('sortBy', sortBy);
        }
        if (sortOrder) {
          params = params.set('sortOrder', sortOrder);
        }

        return this.http.get<any>(`${this.apiUrl}`, { headers, params, withCredentials: true });
      })
    );
  }

  //obtener el id y nombre de todas las categorias 
  getCategories(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/get-categories`, { headers, withCredentials: true });
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
