import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from './csrf.service';
import { environment } from '../environments/config';

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private apiUrl = `${environment.baseUrl}/backups`;

  constructor(private csrfService: CsrfService, private http: HttpClient) {}

  getGoogleAuthUrl(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/auth/google`, { headers, withCredentials: true });
      })
    );
  }

  handleGoogleAuthCallback(code: string): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/auth/google/callback?code=${encodeURIComponent(code)}`, { headers, withCredentials: true });
      })
    );
  }

  configureBackup(backupType: 'full' | 'differential' | 'transactional', configData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/config/${backupType}`, configData, { headers, withCredentials: true });
      })
    );
  }

  getBackupConfig(backupType: 'full' | 'differential' | 'transactional'): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/config/${backupType}`, { headers, withCredentials: true });
      })
    );
  }

  listBackups(backupType?: 'full' | 'differential' | 'transactional', page: number = 1, pageSize: number = 20): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        let params = new HttpParams()
          .set('page', page.toString())
          .set('pageSize', pageSize.toString());
        if (backupType) {
          params = params.set('backup_type', backupType);
        }
        const url = `${this.apiUrl}/history`;
        return this.http.get(url, { headers, params, withCredentials: true });
      })
    );
  }

  runBackup(backupType: 'full' | 'differential' | 'transactional'): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/run/${backupType}`, {}, { headers, withCredentials: true });
      })
    );
  }

  restoreBackup(backupId: number): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/restore`, { backup_id: backupId }, { headers, withCredentials: true });
      })
    );
  }
}