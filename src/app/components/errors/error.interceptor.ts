import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';  // Asegúrate de importar throwError
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error) => {
        if (error.status === 500) {
          this.router.navigate(['/500']);
        } else if (error.status === 400) {
          this.router.navigate(['/400']);
        } else if (error.status === 404) {
          this.router.navigate(['/404']);
        } else {
          console.error('Error no manejado:', error);
        }
        return throwError(() => new Error(error));  
      })
    );
  }
}
