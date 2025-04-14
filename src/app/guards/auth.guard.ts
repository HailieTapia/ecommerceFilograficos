import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../components/services/auth.service';
import { Observable, of } from 'rxjs';
import { map, take, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const allowPublic = route.data['allowPublic'] || false;
    const expectedRole = route.data['role'];
    const isRootPath = state.url === '/' || state.url === '';

    return this.authService.getUser().pipe(
      take(1), // Tomar solo el primer valor para evitar suscripciones infinitas
      map(user => {
        // Permitir acceso a rutas públicas si no hay usuario
        if (allowPublic && !user) {
          return true;
        }

        // Si no hay usuario autenticado, redirigir al login
        if (!user) {
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }

        // Si el usuario es administrador
        if (user.tipo === 'administrador') {
          if (isRootPath) {
            this.router.navigate(['/admin-dashboard']);
            return false;
          }
          if (expectedRole && expectedRole !== 'administrador') {
            this.router.navigate(['/admin-dashboard']);
            return false;
          }
          return true;
        }

        // Si el usuario es cliente
        if (user.tipo === 'cliente') {
          if (expectedRole && expectedRole !== 'cliente') {
            this.router.navigate(['/']);
            return false;
          }
          return true;
        }

        // Otros roles futuros
        return true;
      }),
      catchError(() => {
        this.authService.resetAuthState();
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return of(false);
      })
    );
  }
}