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
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        const expectedRole = route.data['role'];
        if (expectedRole && user.tipo !== expectedRole) {
          this.router.navigate(['/403']); // Página de acceso denegado si es necesario
          return false;
        }

        return true;
      }),
      tap(allowed => {
        if (!allowed) {
          this.router.navigate(['/login']);
        }
      })
    );
  }
}
