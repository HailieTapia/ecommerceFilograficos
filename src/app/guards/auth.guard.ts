import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../components/services/auth.service';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const isRootPath = state.url === '/' || state.url === '';
    const allowPublic = route.data['allowPublic'] || false;
    const expectedRole = route.data['role'];

    return this.authService.getUser().pipe(
      map(user => {
        // Si no hay usuario autenticado
        if (!user) {
          if (allowPublic) return true; // Permitir rutas públicas
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }

        // Si el usuario está autenticado como administrador
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

        // Si el usuario está autenticado como cliente
        if (user.tipo === 'cliente') {
          if (expectedRole && expectedRole !== 'cliente') {
            this.router.navigate(['/']);
            return false;
          }
          return true;
        }

        return true; // Otros roles futuros
      }),
      tap(allowed => {
        // Validar token solo para rutas protegidas y si hay usuario
        if (!allowed && !allowPublic) {
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        } else if (this.authService.isLoggedIn() && !allowPublic) {
          this.authService.checkTokenStatus().subscribe({
            error: (err) => {
              if (err.status === 401) {
                this.authService.resetAuthState();
                this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
              }
            }
          });
        }
      })
    );
  }
}