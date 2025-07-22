import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, interval } from 'rxjs';
import { switchMap, tap, catchError, retry, map, take, filter } from 'rxjs/operators';
import { CsrfService } from './csrf.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/config';

// Interfaces para tipar las respuestas del backend
export interface Recommendation {
  product_id: number | null;
  name: string | null;
  description: string | null;
  product_type: 'Existencia' | 'Personalizado' | null;
  average_rating: number | string;
  total_reviews: number;
  min_price: number | null;
  max_price: number | null;
  total_stock: number;
  variant_count: number;
  category: string | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  collaborator: string | null;
  standard_delivery_days: number | null;
  urgent_delivery_enabled: boolean;
  urgent_delivery_days: number | null;
  urgent_delivery_cost: number | null;
  confidence: number | null;
  lift: number | null;
}

export interface RecommendationResponse {
  message: string;
  error?: string;
  data: {
    user_id: number | null;
    cluster: number | null;
    recommendations: Recommendation[];
  };
}

export interface ClustersResponse {
  message: string;
  error?: string;
  data: {
    [clusterId: string]: {
      average_order_quantity: number;
      total_spent: number;
      number_of_orders: number;
      total_units: number;
      number_of_users: number;
    };
  };
}

export interface RecommendationsWithProductsRequest {
  purchased_products?: string[];
  user_data?: {
    total_spent?: number;
    num_orders?: number;
    total_quantity?: number;
    num_categories?: number;
    avg_rating?: number;
  };
}

// Interfaz para el usuario
interface User {
  userId: number;
  tipo: string;
  nombre: string;
  profilePictureUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private apiUrl = `${environment.baseUrl}/recommendations`;
  private readonly CACHE_KEY = 'recommendations-cache';
  private readonly CACHE_DURATION = 3600 * 1000; // 1 hora en milisegundos
  private currentUserId: number | null = null; // Almacenar el userId actual

  constructor(
    private csrfService: CsrfService,
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.authService.getUser().pipe(
      filter(user => !!user) // Solo procesar si hay un usuario válido
    ).subscribe((user: User | null) => {
      console.log('Usuario desde authService:', user); // Registro de depuración
      this.currentUserId = user ? user.userId : null;
    });

    this.authService.onLogin().subscribe(() => {
      this.clearCache();
      this.authService.getUser().pipe(take(1)).subscribe((user: User | null) => {
        console.log('Usuario después de login:', user); // Registro de depuración
        this.currentUserId = user ? user.userId : null;
      });
    });

    this.authService.onLogout().subscribe(() => {
      this.clearCache();
      this.currentUserId = null;
    });
  }

  /**
   * Limpia los datos almacenados en caché.
   */
  private clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }

  /**
   * Obtiene datos del caché si están disponibles y no han expirado.
   * @param userId ID del usuario para validar el caché.
   * @returns Datos en caché o null si no están disponibles.
   */
  private getCachedData(userId: number): RecommendationResponse | null {
    const cached = localStorage.getItem(this.CACHE_KEY);
    if (!cached) {
      console.log('No se encontró caché para la clave:', this.CACHE_KEY);
      return null;
    }

    const parsed = JSON.parse(cached);
    if (!parsed[userId] || Date.now() - parsed[userId].timestamp > this.CACHE_DURATION) {
      console.log('Fallo de caché o expirado para userId:', userId);
      return null;
    }
    console.log('Acierto de caché para userId:', userId, parsed[userId].data);
    return parsed[userId].data;
  }

  /**
   * Almacena datos en caché para un usuario específico.
   * @param userId ID del usuario.
   * @param data Datos a almacenar.
   */
  private setCachedData(userId: number, data: RecommendationResponse): void {
    if (data.data.recommendations.length === 0 && data.error) {
      console.log('No se almacena en caché respuesta con error:', data.error);
      return;
    }
    const cached = localStorage.getItem(this.CACHE_KEY);
    const cacheData = cached ? JSON.parse(cached) : {};
    cacheData[userId] = {
      timestamp: Date.now(),
      data
    };
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
  }

  /**
   * Obtiene el ID del usuario autenticado.
   * @returns Observable con el ID del usuario o null si no está autenticado.
   */
  private getUserId(): Observable<number | null> {
    return this.authService.getUser().pipe(
      take(1),
      map(user => user ? user.userId : null),
      tap(userId => console.log('getUserId devolvió:', userId)) // Registro de depuración
    );
  }

  /**
   * Obtiene recomendaciones para el usuario autenticado.
   * @param poll Si es true, realiza polling periódico.
   * @returns Observable con las recomendaciones.
   */
  getRecommendations(poll: boolean = false): Observable<RecommendationResponse> {
    if (!this.authService.isLoggedIn()) {
      console.log('Usuario no autenticado, devolviendo respuesta vacía');
      return of({
        message: 'Usuario no autenticado',
        error: 'No authenticated user',
        data: { user_id: null, cluster: null, recommendations: [] }
      });
    }

    return this.getUserId().pipe(
      switchMap(userId => {
        if (!userId) {
          console.log('No se pudo obtener el ID del usuario');
          return of({
            message: 'No se pudo obtener el ID del usuario',
            error: 'Unable to retrieve user ID',
            data: { user_id: null, cluster: null, recommendations: [] }
          });
        }

        if (!poll) {
          const cachedData = this.getCachedData(userId);
          if (cachedData) {
            return of(cachedData);
          }
        }

        return this.csrfService.getCsrfToken().pipe(
          switchMap(csrfToken => {
            const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
            return this.http.get<RecommendationResponse>(`${this.apiUrl}?user_id=${userId}`, {
              headers,
              withCredentials: true
            });
          }),
          retry({ count: 3, delay: 1000 }),
          tap(response => {
            if (response.data.user_id && response.data.user_id === userId) {
              this.setCachedData(response.data.user_id, response);
            } else {
              console.warn('El user_id devuelto no coincide con el usuario autenticado:', response.data.user_id, userId);
            }
          }),
          catchError(error => {
            console.error('Error al obtener recomendaciones:', error);
            const cachedData = this.getCachedData(userId);
            if (cachedData) {
              console.log('Devolviendo datos en caché como respaldo');
              return of(cachedData);
            }
            return of({
              message: 'No se pudieron obtener recomendaciones en este momento',
              error: error.error?.message || 'Recomendaciones no disponibles, intenta de nuevo más tarde',
              data: { user_id: userId, cluster: null, recommendations: [] }
            });
          })
        );
      }),
      poll ? switchMap(response => interval(this.CACHE_DURATION).pipe(switchMap(() => this.getRecommendations(false)))) : map(response => response)
    );
  }

  /**
   * Obtiene recomendaciones basadas en productos comprados.
   * @param data Datos de la solicitud (productos comprados y/o datos del usuario).
   * @returns Observable con las recomendaciones.
   */
  getRecommendationsWithProducts(data: RecommendationsWithProductsRequest): Observable<RecommendationResponse> {
    if (!this.authService.isLoggedIn()) {
      console.log('Usuario no autenticado, devolviendo respuesta vacía');
      return of({
        message: 'Usuario no autenticado',
        error: 'No authenticated user',
        data: { user_id: null, cluster: null, recommendations: [] }
      });
    }

    return this.getUserId().pipe(
      switchMap(userId => {
        if (!userId) {
          console.log('No se pudo obtener el ID del usuario');
          return of({
            message: 'No se pudo obtener el ID del usuario',
            error: 'Unable to retrieve user ID',
            data: { user_id: null, cluster: null, recommendations: [] }
          });
        }

        return this.csrfService.getCsrfToken().pipe(
          switchMap(csrfToken => {
            const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
            const payload = { ...data, user_id: userId };
            return this.http.post<RecommendationResponse>(`${this.apiUrl}/with-products`, payload, {
              headers,
              withCredentials: true
            });
          }),
          retry({ count: 3, delay: 1000 }),
          tap(response => {
            if (response.data.user_id && response.data.user_id === userId) {
              this.setCachedData(response.data.user_id, response);
            } else {
              console.warn('El user_id devuelto no coincide con el usuario autenticado:', response.data.user_id, userId);
            }
          }),
          catchError(error => {
            console.error('Error al obtener recomendaciones con productos:', error);
            const cachedData = this.getCachedData(userId);
            if (cachedData) {
              console.log('Devolviendo datos en caché como respaldo');
              return of(cachedData);
            }
            return of({
              message: 'No se pudieron obtener recomendaciones en este momento',
              error: error.error?.message || 'Recomendaciones no disponibles, intenta de nuevo más tarde',
              data: { user_id: userId, cluster: null, recommendations: [] }
            });
          })
        );
      })
    );
  }

  /**
   * Obtiene el resumen de clústeres.
   * @returns Observable con el resumen de clústeres.
   */
  getClusters(): Observable<ClustersResponse> {
    if (!this.authService.isLoggedIn()) {
      console.log('Usuario no autenticado, devolviendo respuesta vacía');
      return of({
        message: 'Usuario no autenticado',
        error: 'No authenticated user',
        data: {}
      });
    }

    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<ClustersResponse>(`${this.apiUrl}/clusters`, {
          headers,
          withCredentials: true
        });
      }),
      retry({ count: 3, delay: 1000 }),
      catchError(error => {
        console.error('Error al obtener el resumen de clústeres:', error);
        return of({
          message: 'No se pudo obtener el resumen de clústeres en este momento',
          error: error.error?.message || 'Resumen no disponible, intenta de nuevo más tarde',
          data: {}
        });
      })
    );
  }
}