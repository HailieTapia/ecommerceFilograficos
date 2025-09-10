import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../environments/config';

// Interfaz para categorías de insignias
export interface BadgeCategory {
  badge_category_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class BadgeCategoryService {
  private apiUrl = `${environment.baseUrl}/badge-categories`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  /**
   * Obtiene todas las categorías de insignias con paginación y búsqueda (admin)
   * @param page Número de página
   * @param pageSize Tamaño de página
   * @param search Término de búsqueda
   * @param statusFilter Filtro de estado (active, inactive, all)
   * @returns Observable con la lista de categorías y metadatos
   */
  getAllBadgeCategories(page?: number, pageSize?: number, search?: string, statusFilter: 'active' | 'inactive' | 'all' = 'active'): Observable<any> {
    const pageValue = page ?? 1;
    const pageSizeValue = pageSize ?? 10;
    const searchValue = search ?? '';

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        let params = new HttpParams()
          .set('page', pageValue.toString())
          .set('pageSize', pageSizeValue.toString())
          .set('statusFilter', statusFilter);

        if (searchValue) {
          params = params.set('search', searchValue);
        }

        return this.http.get(`${this.apiUrl}/`, {
          headers,
          params,
          withCredentials: true
        });
      })
    );
  }

  /**
   * Obtiene una categoría de insignias por ID
   * @param id ID de la categoría
   * @returns Observable con la categoría
   */
  getBadgeCategoryById(id: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
      })
    );
  }

  /**
   * Crea una nueva categoría de insignias
   * @param categoryData Datos de la categoría
   * @returns Observable con la respuesta del servidor
   */
  createBadgeCategory(categoryData: { name: string; description?: string }): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/`, categoryData, { headers, withCredentials: true });
      })
    );
  }

  /**
   * Actualiza una categoría de insignias
   * @param id ID de la categoría
   * @param updatedData Datos actualizados
   * @returns Observable con la respuesta del servidor
   */
  updateBadgeCategory(id: string, updatedData: { name?: string; description?: string }): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put(`${this.apiUrl}/${id}`, updatedData, { headers, withCredentials: true });
      })
    );
  }

  /**
   * Elimina (lógicamente) una categoría de insignias
   * @param id ID de la categoría
   * @returns Observable con la respuesta del servidor
   */
  deleteBadgeCategory(id: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.delete(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
      })
    );
  }
}