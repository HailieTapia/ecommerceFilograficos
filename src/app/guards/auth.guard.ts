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

        // Si la ruta permite acceso público (como HomeComponent) y no hay usuario autenticado
        if (allowPublic && !user) {
          return true; // Permitir acceso a usuarios no autenticados
        }

        // Si no hay usuario autenticado y la ruta no permite acceso público
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        // Si el usuario es administrador y la ruta es la raíz (HomeComponent)
        if (user.tipo === 'administrador' && route.pathFromRoot.length === 1 && route.routeConfig?.path === '') {
          this.router.navigate(['/company']); // Redirigir a los administradores a /company
          return false;
        }

        // Verificar el rol esperado si está definido
        if (expectedRole && user.tipo !== expectedRole) {
          this.router.navigate(['/403']); // Página de acceso denegado si es necesario
          return false;
        }

        return true;
      }),
      tap(allowed => {
        if (!allowed && !route.data['allowPublic']) {
          this.router.navigate(['/login']);
        }
      })
    );
  }
}