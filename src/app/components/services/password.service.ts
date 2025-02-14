import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../environments/config';

@Injectable({
  providedIn: 'root'
})
export class PasswordService {

  private apiUrl = `${environment.baseUrl}`;

  constructor(private csrfService: CsrfService, private http: HttpClient) { }

  //Método para cambiar la contraseña del usuario autenticado(NO)



  // Método para iniciar el proceso de recuperación de contraseña
  initiatePasswordRecovery(credentials: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/password/initiate-password-recovery`, credentials, { headers, withCredentials: true });
      })
    );
  }

  //metodo para verificar el codigo otp para recuperacion de contraseña(NO)
  verifyOTP(credentials: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/password/verify-otp`, credentials, { headers, withCredentials: true });
      })
    );
  }

  //metodo para reestablecer una contraseña(NO)
  resetPassword(credentials: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/password/reset-password`, credentials, { headers, withCredentials: true });
      })
    );
  }
}
