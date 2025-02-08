import { Injectable } from '@angular/core';
import { HttpClient ,HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://backend-filograficos.vercel.app/api'; 

  constructor(private csrfService: CsrfService,private http: HttpClient) {}

  register(userData: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.post(`${this.apiUrl}/auth/register/`, userData, { headers, withCredentials: true });
      })
    );
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/verify-email?token=${token}`);
  }
}
