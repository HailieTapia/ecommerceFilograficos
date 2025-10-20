import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from './csrf.service';
import { environment } from '../environments/config';

// Interfaz para insignias (Mantener)
export interface Badge {
  badge_id: number;
  name: string;
  description?: string;
  icon_url: string;
  public_id: string;
  badge_category_id: number;
  category_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Interfaz para categorías de insignias (Mantener)
export interface BadgeCategory {
  badge_category_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  badge_count: number;
}

// --- NUEVAS INTERFACES PARA LA PAGINACIÓN POR USUARIO ---

// Interfaz para una insignia individual dentro del array de 'badges'
export interface NestedBadge {
  user_badge_id: number;
  badge_id: number;
  badge_name: string;
  badge_category: string;
  icon_url: string;
  obtained_at: string;
  category_name?: string; // Soporta el nombre de la categoría
}

// Interfaz para la ENTIDAD AGRUPADA POR USUARIO (UserBadgeGroup)
export interface UserBadgeGroup {
  user_id: number;
  user_email: string;
  user_name: string;
  total_badges: number; // Total de insignias para este usuario (según filtros)
  last_obtained_at: string; // Fecha de la insignia más reciente
  badges: NestedBadge[]; // La lista de insignias obtenidas por este usuario
}

// Interfaz para la respuesta paginada del historial (ACTUALIZADA)
export interface GrantedHistoryResponse {
  message: string;
  history: UserBadgeGroup[]; // <<-- CAMBIO CLAVE
  total: number; // Total de usuarios únicos
  page: number;
  pageSize: number;
}
// --- FIN NUEVAS INTERFACES ---


// Interfaz para métricas de insignias (Mantener)
export interface BadgeMetrics {
  totalBadgesObtained: number;
  uniqueUsersCount: number;
  badgeDistribution: {
    badge_id: number;
    badge_name: string;
    category_name: string;
    icon_url: string;
    count: number;
  }[];
}

// Interfaz para datos de tendencias (Mantener)
export interface AcquisitionTrendItem {
  date: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class BadgeService {
  private apiUrl = `${environment.baseUrl}/badges`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  /**
   * Obtiene todas las insignias con paginación y búsqueda (admin)
   * @param page Número de página
   * @param pageSize Tamaño de página
   * @param search Término de búsqueda
   * @param statusFilter Filtro de estado (active, inactive, all)
   * @returns Observable con la lista de insignias y metadatos
   */
  getAllBadges(page?: number, pageSize?: number, search?: string, statusFilter: 'active' | 'inactive' | 'all' = 'active'): Observable<any> {
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
   * Obtiene todas las insignias activas (solo id y nombre)
   * @returns Observable con la lista de insignias activas
   */
  getActiveBadges(): Observable<{ message: string; badges: { badge_id: number; name: string }[]; total: number }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<{ message: string; badges: { badge_id: number; name: string }[]; total: number }>(
          `${this.apiUrl}/active`,
          { headers, withCredentials: true }
        );
      })
    );
  }

  /**
   * Obtiene una insignia por ID
   * @param id ID de la insignia
   * @returns Observable con la insignia
   */
  getBadgeById(id: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
      })
    );
  }

  /**
   * Crea una nueva insignia
   * @param badgeData Datos de la insignia
   * @param file Imagen de la insignia
   * @returns Observable con la respuesta del servidor
   */
  createBadge(badgeData: { name: string; description?: string; badge_category_id: number }, file: File): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const formData = new FormData();
        formData.append('name', badgeData.name);
        if (badgeData.description) {
          formData.append('description', badgeData.description);
        }
        formData.append('badge_category_id', badgeData.badge_category_id.toString());
        formData.append('badgeIcon', file);

        return this.http.post(`${this.apiUrl}/`, formData, { headers, withCredentials: true });
      })
    );
  }

  /**
   * Actualiza una insignia existente
   * @param id ID de la insignia
   * @param updatedData Datos actualizados
   * @param file Imagen de la insignia (opcional)
   * @returns Observable con la respuesta del servidor
   */
  updateBadge(id: string, updatedData: { name?: string; description?: string; badge_category_id?: number }, file?: File): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const formData = new FormData();
        if (updatedData.name) {
          formData.append('name', updatedData.name);
        }
        if (updatedData.description !== undefined) {
          formData.append('description', updatedData.description);
        }
        if (updatedData.badge_category_id) {
          formData.append('badge_category_id', updatedData.badge_category_id.toString());
        }
        if (file) {
          formData.append('badgeIcon', file);
        }

        return this.http.put(`${this.apiUrl}/${id}`, formData, { headers, withCredentials: true });
      })
    );
  }

  /**
   * Elimina (lógicamente) una insignia
   * @param id ID de la insignia
   * @returns Observable con la respuesta del servidor
   */
  deleteBadge(id: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.delete(`${this.apiUrl}/${id}`, { headers, withCredentials: true });
      })
    );
  }

  /**
   * Obtiene categorías de insignias con conteo de insignias
   * @param page Número de página
   * @param pageSize Tamaño de página
   * @param search Término de búsqueda
   * @param statusFilter Filtro de estado (active, inactive, all)
   * @returns Observable con la lista de categorías y conteo
   */
  getBadgeCategoriesWithCount(page?: number, pageSize?: number, search?: string, statusFilter: 'active' | 'inactive' | 'all' = 'active'): Observable<any> {
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

        return this.http.get(`${this.apiUrl}/categories`, {
          headers,
          params,
          withCredentials: true
        });
      })
    );
  }

/**
   * Obtiene el historial de insignias otorgadas con paginación y filtros
   * (Ahora retorna grupos de usuarios, no registros de insignias individuales)
   * @param page Número de página
   * @param pageSize Tamaño de página
   * @param userId Filtro opcional por ID de usuario
   * @param badgeId Filtro opcional por ID de insignia
   * @param badgeCategoryId Filtro opcional por ID de categoría
   * @param startDate Filtro opcional por fecha de inicio (YYYY-MM-DD)
   * @param endDate Filtro opcional por fecha de fin (YYYY-MM-DD)
   * @param search Término de búsqueda (nombre, email o user_id)
   * @param sort Parámetro de ordenación (Ahora debe ser 'total_badges:DESC' o 'last_obtained_at:DESC')
   * @returns Observable con la lista de usuarios agrupados y metadatos
   */
  getGrantedBadgesHistory(
    page?: number,
    pageSize?: number,
    userId?: number,
    badgeId?: number,
    badgeCategoryId?: number,
    startDate?: string,
    endDate?: string,
    search?: string,
    sort?: string
  ): Observable<GrantedHistoryResponse> {
    const pageValue = page ?? 1;
    const pageSizeValue = pageSize ?? 10;

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        let params = new HttpParams()
          .set('page', pageValue.toString())
          .set('pageSize', pageSizeValue.toString());

        if (userId) {
          params = params.set('userId', userId.toString());
        }
        if (badgeId) {
          params = params.set('badgeId', badgeId.toString());
        }
        if (badgeCategoryId) {
          params = params.set('badgeCategoryId', badgeCategoryId.toString());
        }
        if (startDate) {
          params = params.set('startDate', startDate);
        }
        if (endDate) {
          params = params.set('endDate', endDate);
        }
        if (search) {
          params = params.set('search', search);
        }
        if (sort) {
          params = params.set('sort', sort);
        }

        return this.http.get<GrantedHistoryResponse>(`${this.apiUrl}/history`, {
          headers,
          params,
          withCredentials: true
        });
      })
    );
  }

  /**
   * Obtiene métricas generales de insignias (totales, usuarios únicos, top 5)
   * @returns Observable con las métricas
   */
  getBadgeMetrics(): Observable<{ message: string; metrics: BadgeMetrics }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<{ message: string; metrics: BadgeMetrics }>(`${this.apiUrl}/metrics`, {
          headers,
          withCredentials: true
        });
      })
    );
  }

  /**
   * Obtiene tendencias de adquisición de insignias por día
   * @param days Número de días a incluir (máximo 365)
   * @returns Observable con los datos de tendencia
   */
  getAcquisitionTrend(days: number = 30): Observable<{ message: string; trend: AcquisitionTrendItem[] }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const params = new HttpParams().set('days', days.toString());
        return this.http.get<{ message: string; trend: AcquisitionTrendItem[] }>(`${this.apiUrl}/trends`, {
          headers,
          params,
          withCredentials: true
        });
      })
    );
  }
}