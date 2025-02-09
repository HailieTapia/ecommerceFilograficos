import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../environments/config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.baseUrl}`;

  constructor(private csrfService: CsrfService, private http: HttpClient) { }

  //RECUPERACION DE CONTRASEÑA  
  //iniciar el proceso de recuperación de contraseña
  recover(credentials: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/password/initiate-password-recovery`, credentials, { headers, withCredentials: true });
      })
    );
  }

  //verificar el código OTP
  verify(credentials: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/password/verify-otp`, credentials, { headers, withCredentials: true });
      })
    );
  }

  //reestablecer la contraseña
  resets(credentials: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/password/reset-password`, credentials, { headers, withCredentials: true });
      })
    );
  }
}
