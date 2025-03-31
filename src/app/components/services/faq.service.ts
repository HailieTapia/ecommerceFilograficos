import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { AuthService } from '../services/auth.service'; // Importar AuthService
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
  createdAt?: string; // Opcional, solo para administradores
  updatedAt?: string; // Opcional, solo para administradores
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
    private authService: AuthService // Inyectar AuthService
  ) {}

  // Método genérico para construir y realizar solicitudes HTTP
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

  // Determinar si el usuario es administrador
  private isAdminUser(): boolean {
    const userRole = this.authService.getUserRole();
    return userRole === 'administrador';
  }

  // Crear una nueva pregunta frecuente
  createFaq(faqData: { category_id: number; question: string; answer: string }): Observable<any> {
    return this.request('POST', '/', faqData);
  }

  // Obtener todas las preguntas frecuentes activas con opciones de paginación, búsqueda, filtro y agrupación
  getAllFaqs(params: FaqParams = {}, isAdmin?: boolean): Observable<FaqResponse> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.pageSize !== undefined) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    if (params.search) httpParams = httpParams.set('search', params.search.trim());
    if (params.categoryId !== undefined) httpParams = httpParams.set('category_id', params.categoryId.toString());
    if (params.grouped !== undefined) httpParams = httpParams.set('grouped', params.grouped.toString());

    // Determinar si usar la ruta de admin o pública
    const useAdminRoute = isAdmin !== undefined ? isAdmin : this.isAdminUser();
    const endpoint = useAdminRoute ? '/' : '/public';

    return this.request<FaqResponse>('GET', endpoint, undefined, httpParams);
  }

  // Obtener una pregunta frecuente por ID
  getFaqById(id: string, isAdmin?: boolean): Observable<Faq> {
    // Determinar si usar la ruta de admin o pública
    const useAdminRoute = isAdmin !== undefined ? isAdmin : this.isAdminUser();
    const endpoint = useAdminRoute ? `/${id}` : `/public/${id}`;

    return this.request<Faq>('GET', endpoint);
  }

  // Actualizar una pregunta frecuente
  updateFaq(id: number, updatedData: { category_id?: number; question?: string; answer?: string; status?: 'active' | 'inactive' }): Observable<any> {
    return this.request('PUT', `/${id}`, updatedData);
  }

  // Eliminar (lógicamente) una pregunta frecuente
  deleteFaq(id: string): Observable<any> {
    return this.request('DELETE', `/${id}`);
  }
}