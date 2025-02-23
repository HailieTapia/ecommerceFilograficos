import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const router = inject(Router); 

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Redirigir al login sin llamar a logout()
        router.navigate(['/login']);
      } else if (error.status === 400) {
        router.navigate(['/400']);
      } else if (error.status === 404) {
        router.navigate(['/404']);
      } else if (error.status === 500) {
        router.navigate(['/500']);
      } else {
        router.navigate(['/404']);
      }
      return throwError(() => error);
    })
  );
};