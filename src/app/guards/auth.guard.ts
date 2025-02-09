import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}'); // Obtiene el usuario del localStorage

    if (!user || !user.user_type) {
      this.router.navigate(['/login']); 
      return false;
    }

    // Verifica el rol según la ruta
    const expectedRole = route.data['role']; // Obtiene el rol esperado desde las rutas

    if (expectedRole && user.user_type !== expectedRole) {
      this.router.navigate(['/profile']); // Redirige a la página de perfil si no tiene permiso
      return false;
    }

    return true; // Permite el acceso si cumple con el rol requerido
  }
}
