import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../environments/config';

@Injectable({
  providedIn: 'root'
})
export class PasswordService {

  private apiUrl = `${environment.baseUrl}`;

  constructor(private csrfService: CsrfService, private http: HttpClient) { }

  //Método para cambiar la contraseña del usuario autenticado(NO)
  changePassword(data: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.put(`${this.apiUrl}/password/change-password`, data, { headers, withCredentials: true });
      })
    );
  }

  // Método para iniciar el proceso de recuperación de contraseña
  initiatePasswordRecovery(data: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/password/initiate-password-recovery`, data, { headers, withCredentials: true });
      })
    );
  }

  //metodo para verificar el codigo otp para recuperacion de contraseña(NO)
  verifyOTP(data: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/password/verify-otp`, data, { headers, withCredentials: true });
      })
    );
  }

  //metodo para reestablecer una contraseña(NO)
  resetPassword(data: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/password/reset-password`, data, { headers, withCredentials: true });
      })
    );
  }
  // Controlador para verificar si una contraseña está comprometida
  checkPassword(data: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/password/check-password`, data, { headers, withCredentials: true });
      })
    );
  }
}
