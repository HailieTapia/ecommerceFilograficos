import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from './csrf.service';
import { environment } from '../../environments/config';

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private apiUrl = `${environment.baseUrl}/backups`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  // Obtener la URL de autenticación con Google
  getGoogleAuthUrl(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/auth/google`, { headers, withCredentials: true });
      })
    );
  }

  // Manejar el callback de Google OAuth2
  handleGoogleAuthCallback(code: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/auth/google/callback?code=${encodeURIComponent(code)}`, { headers, withCredentials: true });
      })
    );
  }

  // Configurar respaldos
  configureBackup(configData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/config`, configData, { headers, withCredentials: true });
      })
    );
  }

  // Obtener la configuración de respaldos
  getBackupConfig(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/config/full`, { headers, withCredentials: true });
      })
    );
  }

  // Listar respaldos
  listBackups(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/history`, { headers, withCredentials: true });
      })
    );
  }

  // Ejecutar un respaldo manual
  runBackup(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/run`, {}, { headers, withCredentials: true });
      })
    );
  }

  // Restaurar un respaldo
  restoreBackup(backupData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/restore`, backupData, { headers, withCredentials: true });
      })
    );
  }
}