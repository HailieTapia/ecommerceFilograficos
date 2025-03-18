import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../components/services/auth.service';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.getUser().pipe(
      map(user => {
        const expectedRole = route.data['role'];
        const allowPublic = route.data['allowPublic'] || false;
        // Corregimos la detección de la raíz usando state.url
        const isRootPath = state.url === '/' || state.url === '';

        // Si no hay usuario autenticado
        if (!user) {
          if (allowPublic) {
            return true; // Permitir acceso público
          }
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }

        // Si el usuario está autenticado como administrador
        if (user.tipo === 'administrador') {
          if (isRootPath) {
            this.router.navigate(['/admin-dashboard']);
            return false; // Denegar acceso a la raíz para administradores
          }
          if (expectedRole && expectedRole !== 'administrador') {
            this.router.navigate(['/admin-dashboard']);
            return false; // Denegar acceso a rutas no administrativas
          }
          return true; // Permitir acceso a rutas administrativas
        }

        // Si el usuario está autenticado como cliente
        if (user.tipo === 'cliente') {
          if (expectedRole && expectedRole !== 'cliente') {
            this.router.navigate(['/']);
            return false; // Denegar acceso a rutas no de cliente
          }
          return true; // Permitir acceso a rutas de cliente o públicas
        }

        // Caso por defecto (otros roles futuros, si los hay)
        return true;
      }),
      tap(allowed => {
        if (!allowed && !route.data['allowPublic']) {
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        }
      })
    );
  }
}