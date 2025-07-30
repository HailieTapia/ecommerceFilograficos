import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { CsrfService } from './csrf.service';
import { environment } from '../environments/config';

export interface Banner {
  banner_id: number;
  title: string;
  description?: string | null;
  image_url: string;
  public_id: string;
  cta_text?: string | null;
  cta_link?: string | null;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BannerService {
  private apiUrl = `${environment.baseUrl}/banners`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = error.error?.message || 'Error en la comunicación con el servidor';
    console.error('Error en la solicitud:', error);
    return throwError(() => new Error(message));
  }

  createBanners(formData: FormData): Observable<{ success: boolean; message: string; banners: Banner[] }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post<{ success: boolean; message: string; banners: Banner[] }>(
          `${this.apiUrl}/`,
          formData,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  getAllBanners(): Observable<{ success: boolean; banners: Banner[] }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<{ success: boolean; banners: Banner[] }>(
          `${this.apiUrl}/all`,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  getActiveBanners(): Observable<{ success: boolean; banners: Banner[] }> {
    return this.http.get<{ success: boolean; banners: Banner[] }>(
      `${this.apiUrl}/active`,
      { withCredentials: true }
    ).pipe(catchError(this.handleError));
  }

  updateBanner(bannerId: number, formData: FormData): Observable<{ success: boolean; message: string; banner: Banner }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put<{ success: boolean; message: string; banner: Banner }>(
          `${this.apiUrl}/${bannerId}`,
          formData,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  deleteBanner(bannerId: number): Observable<{ success: boolean; message: string }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.delete<{ success: boolean; message: string }>(
          `${this.apiUrl}/${bannerId}`,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  getBannersVisibility(): Observable<{ success: boolean; show_banners_to_users: boolean }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get<{ success: boolean; show_banners_to_users: boolean }>(
          `${this.apiUrl}/visibility`,
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  toggleBannersVisibility(show: boolean): Observable<{ success: boolean; message: string; show_banners_to_users: boolean }> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put<{ success: boolean; message: string; show_banners_to_users: boolean }>(
          `${this.apiUrl}/visibility`,
          { show_banners_to_users: show },
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }
}