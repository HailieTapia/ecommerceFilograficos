import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../components/services/auth.service';
import { ModalService } from '../components/services/modal.service';
import { Observable, of } from 'rxjs';
import { map, take, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private modalService: ModalService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const allowPublic = route.data['allowPublic'] || false;
    const expectedRole = route.data['role'];
    const isRootPath = state.url === '/' || state.url === '';
    const isCollectionPath = state.url.startsWith('/collection');
    const isLoginPath = state.url.startsWith('/login');

    return this.authService.getUser().pipe(
      take(1),
      map(user => {
        // Permitir acceso a rutas públicas si no hay usuario
        if (allowPublic && !user) {
          return true;
        }

        // Si el usuario no está autenticado y no es la ruta /login
        if (!user && !isLoginPath) {
          this.modalService.showLoginModal(true);
          this.router.navigate(['login'], { queryParams: { returnUrl: state.url } });
          return false;
        }

        // Si el usuario es administrador
        if (user && user.tipo === 'administrador') {
          if (isRootPath) {
            this.router.navigate(['/admin-dashboard']);
            return false;
          }
          if (isCollectionPath) {
            this.router.navigate(['/product-catalog']);
            return false;
          }
          if (expectedRole && expectedRole !== 'administrador') {
            this.router.navigate(['/admin-dashboard']);
            return false;
          }
          return true;
        }

        // Si el usuario es cliente
        if (user && user.tipo === 'cliente') {
          if (expectedRole && expectedRole !== 'cliente') {
            this.router.navigate(['/']);
            return false;
          }
          return true;
        }

        // Permitir acceso si es la ruta /login
        if (isLoginPath) {
          return true;
        }

        // Otros roles futuros
        return true;
      }),
      catchError(() => {
        this.authService.resetAuthState();
        if (!isLoginPath) {
          this.modalService.showLoginModal(true);
          this.router.navigate(['login'], { queryParams: { returnUrl: state.url } });
        }
        return of(false);
      })
    );
  }
}