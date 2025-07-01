import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../environments/config';

// Interfaz para categorías públicas
export interface FaqCategory {
  category_id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class FaqCategoryService {
  private apiUrl = `${environment.baseUrl}/faq-categories`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  /**
   * Crea una nueva categoría de FAQ
   * @param categoryData Datos de la categoría
   * @returns Observable con la respuesta del servidor
   */
  createCategory(categoryData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/`, categoryData, { headers, withCredentials: true });
      })
    );
  }

  /**
   * Obtiene una categoría de FAQ por ID
   * @param id ID de la categoría
   * @returns Observable con la categoría
   */
  getCategoryById(id: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
      })
    );
  }

  /**
   * Obtiene todas las categorías de FAQ activas con paginación y búsqueda (admin)
   * @param page Número de página
   * @param pageSize Tamaño de página
   * @param search Término de búsqueda
   * @returns Observable con la lista de categorías
   */
  getAllCategories(page?: number, pageSize?: number, search?: string): Observable<any> {
    const pageValue = page ?? 1;
    const pageSizeValue = pageSize ?? 10;
    const searchValue = search ?? '';

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        let params = new HttpParams()
          .set('page', pageValue.toString())
          .set('pageSize', pageSizeValue.toString());

        if (searchValue) {
          params = params.set('search', searchValue);
        }

        return this.http.get(`${this.apiUrl}/`, {
          headers,
          params,
          withCredentials: true,
        });
      })
    );
  }

  /**
   * Actualiza una categoría de FAQ
   * @param id ID de la categoría
   * @param updatedData Datos actualizados
   * @returns Observable con la respuesta del servidor
   */
  updateCategory(id: string, updatedData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put(`${this.apiUrl}/${id}`, updatedData, { headers, withCredentials: true });
      })
    );
  }

  /**
   * Elimina (lógicamente) una categoría de FAQ
   * @param id ID de la categoría
   * @returns Observable con la respuesta del servidor
   */
  deleteCategory(id: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.delete(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
      })
    );
  }

  /**
   * Obtiene ID y nombre de categorías activas (público)
   * @returns Observable con la lista de categorías públicas
   */
  getPublicCategories(): Observable<FaqCategory[]> {
    return this.http.get<FaqCategory[]>(`${this.apiUrl}/public`);
  }
}