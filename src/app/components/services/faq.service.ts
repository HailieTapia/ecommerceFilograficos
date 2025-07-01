import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/config';

// Interfaces para tipado
export interface Faq {
  id: number;
  question: string;
  answer: string;
  category: {
    id: number;
    name: string;
    description: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface GroupedFaq {
  id: number;
  name: string;
  description: string;
  faqs: {
    id: number;
    question: string;
    answer: string;
    createdAt?: string;
    updatedAt?: string;
  }[];
}

export interface FaqResponse {
  faqs: Faq[] | GroupedFaq[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FaqParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: number;
  grouped?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class FaqService {
  private apiUrl = `${environment.baseUrl}/faq`;

  constructor(
    private csrfService: CsrfService,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Realiza una solicitud HTTP con CSRF token
   * @param method Método HTTP (GET, POST, PUT, DELETE)
   * @param endpoint Endpoint de la API
   * @param body Cuerpo de la solicitud (opcional)
   * @param params Parámetros de consulta (opcional)
   * @returns Observable con la respuesta
   */
  private request<T>(method: string, endpoint: string, body?: any, params?: HttpParams): Observable<T> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.request<T>(method, `${this.apiUrl}${endpoint}`, {
          headers,
          params,
          body,
          withCredentials: true,
        });
      })
    );
  }

  /**
   * Determina si el usuario es administrador
   * @returns true si el usuario tiene rol de administrador
   */
  private isAdminUser(): boolean {
    const userRole = this.authService.getUserRole();
    return userRole === 'administrador';
  }

  /**
   * Crea una nueva pregunta frecuente
   * @param faqData Datos de la FAQ (category_id, question, answer)
   * @returns Observable con la respuesta del servidor
   */
  createFaq(faqData: { category_id: number; question: string; answer: string }): Observable<any> {
    return this.request('POST', '/', faqData);
  }

  /**
   * Obtiene todas las preguntas frecuentes activas
   * @param params Parámetros de paginación, búsqueda, filtro y agrupación
   * @param isAdmin Forzar ruta admin o pública (opcional)
   * @returns Observable con la lista de FAQs y metadatos
   */
  getAllFaqs(params: FaqParams = {}, isAdmin?: boolean): Observable<FaqResponse> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.pageSize !== undefined) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    if (params.search) httpParams = httpParams.set('search', params.search.trim());
    if (params.categoryId !== undefined) httpParams = httpParams.set('category_id', params.categoryId.toString());
    if (params.grouped !== undefined) httpParams = httpParams.set('grouped', params.grouped.toString());

    const useAdminRoute = isAdmin !== undefined ? isAdmin : this.isAdminUser();
    const endpoint = useAdminRoute ? '/' : '/public';

    return this.request<FaqResponse>('GET', endpoint, undefined, httpParams);
  }

  /**
   * Obtiene una pregunta frecuente por ID
   * @param id ID de la FAQ
   * @param isAdmin Forzar ruta admin o pública (opcional)
   * @returns Observable con la FAQ
   */
  getFaqById(id: string, isAdmin?: boolean): Observable<Faq> {
    const useAdminRoute = isAdmin !== undefined ? isAdmin : this.isAdminUser();
    const endpoint = useAdminRoute ? `/${id}` : `/public/${id}`;

    return this.request<Faq>('GET', endpoint);
  }

  /**
   * Actualiza una pregunta frecuente
   * @param id ID de la FAQ
   * @param updatedData Datos actualizados
   * @returns Observable con la respuesta del servidor
   */
  updateFaq(id: number, updatedData: { category_id?: number; question?: string; answer?: string; status?: 'active' | 'inactive' }): Observable<any> {
    return this.request('PUT', `/${id}`, updatedData);
  }

  /**
   * Elimina (lógicamente) una pregunta frecuente
   * @param id ID de la FAQ
   * @returns Observable con la respuesta del servidor
   */
  deleteFaq(id: string): Observable<any> {
    return this.request('DELETE', `/${id}`);
  }
}