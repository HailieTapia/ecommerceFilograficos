import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  listBackups(backupType?: 'full' | 'differential' | 'transactional'): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        const url = backupType ? `${this.apiUrl}/history?backup_type=${backupType}` : `${this.apiUrl}/history`;
        return this.http.get(url, { headers, withCredentials: true });
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