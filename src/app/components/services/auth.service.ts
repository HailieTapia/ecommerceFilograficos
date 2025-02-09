import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../environments/config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.baseUrl}`;

  private userSubject = new BehaviorSubject<any>(null); 
  public user$ = this.userSubject.asObservable(); 

  constructor(private csrfService: CsrfService, private http: HttpClient) { }

  // Obtener el perfil del usuario al iniciar sesión
  fetchUserProfile(): void {
    this.http.get(`${this.apiUrl}/users/profile`, { withCredentials: true })
      .subscribe(user => {
        this.userSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user)); 
      }, () => {
        this.userSubject.next(null);
        localStorage.removeItem('user'); 
      });
  }


  register(userData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/auth/register`, userData, { headers, withCredentials: true });
      })
    );
  }

  login(loginData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/auth/login`, loginData, { headers, withCredentials: true })
          .pipe(
            tap(() => {
              this.fetchUserProfile(); 
            })
          );
      })
    );
  }

  logout(): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/auth/logout`, {}, { headers, withCredentials: true })
          .pipe(
            tap(() => {
              this.userSubject.next(null);
              localStorage.removeItem('user'); 
            })
          );
      })
    );
  }
}
