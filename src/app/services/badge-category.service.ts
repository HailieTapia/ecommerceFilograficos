import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../environments/config';

// Interfaz para insignias asociadas
export interface Badge {
  badge_id: number;
  name: string;
  icon_url: string;
  is_active: boolean;
}

// Interfaz para categorías de insignias (actualizada para incluir insignias)
export interface BadgeCategory {
  badge_category_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  badges: Badge[]; // ¡Añadido para cumplir con la HU!
}

// Interfaz para el Reporte de Distribución
export interface BadgeDistributionReportItem {
    category_id: number;
    category_name: string;
    total_badges: number;
}

@Injectable({
  providedIn: 'root'
})
export class BadgeCategoryService {
  private apiUrl = `${environment.baseUrl}/badge-categories`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  // ====================================================================
  // 1. OBTENER CATEGORÍAS (Actualizado con filtros y ordenamiento del Backend)
  // ====================================================================
  /**
   * Obtiene todas las categorías de insignias con paginación, búsqueda, filtros y ordenamiento (admin)
   * @param page Número de página
   * @param pageSize Tamaño de página
   * @param search Término de búsqueda (en nombre/descripción de la categoría)
   * @param statusFilter Filtro de estado (active, inactive, all)
   * @param sort Parámetro de ordenamiento (ej. "name:ASC,created_at:DESC")
   * @param badgeNameFilter Filtro por nombre de insignia asociada
   * @returns Observable con la lista de categorías y metadatos
   */
  getAllBadgeCategories(
    page?: number, 
    pageSize?: number, 
    search?: string, 
    statusFilter: 'active' | 'inactive' | 'all' = 'active',
    sort?: string, // NUEVO: Parámetro de ordenamiento
    badgeNameFilter?: string // NUEVO: Filtro por insignia
  ): Observable<any> {
    const pageValue = page ?? 1;
    const pageSizeValue = pageSize ?? 10;

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        let params = new HttpParams()
          .set('page', pageValue.toString())
          .set('pageSize', pageSizeValue.toString())
          .set('statusFilter', statusFilter);

        // Agregar parámetros opcionales
        if (search) {
          params = params.set('search', search);
        }
        if (sort) { // Añadir ordenamiento
            params = params.set('sort', sort);
        }
        if (badgeNameFilter) { // Añadir filtro por nombre de insignia
            params = params.set('badgeName', badgeNameFilter);
        }

        return this.http.get(`${this.apiUrl}/`, {
          headers,
          params,
          withCredentials: true
        });
      })
    );
  }

  // ====================================================================
  // 2. REPORTE (¡NUEVO!)
  // ====================================================================
  /**
   * Obtiene el reporte de distribución de insignias por categoría.
   * @returns Observable con el array del reporte.
   */
  getBadgeDistributionReport(): Observable<{ message: string; report: BadgeDistributionReportItem[] }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<{ message: string; report: BadgeDistributionReportItem[] }>(
            `${this.apiUrl}/report/distribution`, 
            { headers, withCredentials: true }
        );
      })
    );
  }

  // ====================================================================
  // 3. CRUD (Sin cambios funcionales, solo se mantienen)
  // ====================================================================

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