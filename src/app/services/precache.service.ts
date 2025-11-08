import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Servicios que contienen las llamadas API
import { UserService } from './user.service';
import { RegulatoryService } from './regulatory.service';
import { FaqService } from './faq.service';
import { CompanyService } from './company.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PrecacheService {

  constructor(
    private userService: UserService,
    private regulatoryService: RegulatoryService,
    private faqService: FaqService,
    private companyService: CompanyService,
    private authService: AuthService
  ) { }

  /**
   * Ejecuta llamadas a las APIs críticas para forzar que el Service Worker cachee los datos.
   * Usamos forkJoin para ejecutar todas las llamadas en paralelo. Si alguna falla, no interrumpe el proceso.
   */
  prefetchCriticalData(): void {
    console.log('NGSW: Iniciando precaching de datos críticos...');
    
    // 1. Datos públicos (getCompanyInfo, getAllCurrentVersions, getAllFaqs)
    const publicDataCalls: Observable<any>[] = [
        // Información de la Compañía (Ruta: /api/company)
        this.companyService.getCompanyInfo().pipe(
            catchError(err => { console.warn('NGSW: Error precacheando Company Info. Posiblemente solo disponible para Admin.', err); return [null]; })
        ),
        // Documentos Regulatorios (Ruta: /api/regulatory)
        // Nota: Asegúrate de que este endpoint sea el que devuelve los datos que quieres guardar.
        this.regulatoryService.getAllCurrentVersions().pipe(
            catchError(err => { console.error('NGSW: Error precacheando Documentos Regulatorios:', err); return [null]; })
        ),
        // FAQs Públicas (Ruta: /api/faq/public)
        this.faqService.getAllFaqs({ grouped: true }, false).pipe(
            catchError(err => { console.error('NGSW: Error precacheando FAQs:', err); return [null]; })
        )
    ];

    // 2. Datos autenticados (Perfil)
    // Solo precacheamos el perfil si el usuario ya está logueado en la sesión actual
    if (this.authService.isLoggedIn()) {
        console.log('NGSW: Usuario autenticado. Intentando precachear datos de perfil...');
        // Perfil de Usuario (Ruta: /api/users/profile)
        publicDataCalls.push(
            this.userService.getProfile().pipe(
                catchError(err => { console.error('NGSW: Error precacheando Perfil de Usuario. Esto es común si el token expira.', err); return [null]; })
            )
        );
    }

    // Ejecutar todas las llamadas y suscribirse
    forkJoin(publicDataCalls).subscribe({
      next: () => console.log('NGSW: Precache de datos críticos finalizado.'),
      error: (err) => console.warn('NGSW: El proceso de precache terminó, pero con errores en algunas llamadas.', err)
    });
  }
}