import { Component, OnInit, OnDestroy, LOCALE_ID } from '@angular/core';
import { RegulatoryService } from '../../services/regulatory.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { Subject, takeUntil } from 'rxjs';

// Registrar los datos de localización para español
registerLocaleData(localeEs);

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule, DatePipe, SafeHtmlPipe],
  templateUrl: './legal.component.html',
  styleUrl: './legal.component.css',
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
})
export class LegalComponent implements OnInit, OnDestroy {
  documentContent: string | null = null;
  documentTitle: string = '';
  documentVersion: string | null = null;
  effectiveDate: string | null = null;
  updatedAt: string | null = null;
  selectedDocument: string = '';

  // Documentos válidos con mapeo de diferentes formatos
  private validDocuments = {
    'Política de Privacidad': 'Política de Privacidad',
    'Política de privacidad': 'Política de Privacidad',
    'Términos y Condiciones': 'Términos y Condiciones',
    'Términos y condiciones': 'Términos y Condiciones',
    'Deslinde Legal': 'Deslinde Legal',
    'Deslinde legal': 'Deslinde Legal'
  };

  private destroy$ = new Subject<void>();

  constructor(
    private regulatoriosService: RegulatoryService,
    private datePipe: DatePipe,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const document = params['document'] || 'Política de Privacidad';
        this.loadDocument(document);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDocument(title: string): void {
    // Normalizar el título del documento
    const normalizedTitle = this.normalizeDocumentTitle(title);

    // Actualizar estado del componente
    this.documentTitle = normalizedTitle;
    this.selectedDocument = normalizedTitle;
    this.documentContent = null;
    this.documentVersion = null;
    this.effectiveDate = null;
    this.updatedAt = null;

    // Cargar contenido del documento
    this.regulatoriosService.getCurrentVersion(normalizedTitle)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data?.DocumentVersions?.length) {
            const latestVersion = data.DocumentVersions[0];
            this.documentContent = latestVersion.content || 'Contenido no disponible.';
            this.documentVersion = latestVersion.version || 'Desconocida';
          } else {
            this.documentContent = 'No hay versiones disponibles para este documento.';
          }

          // Formatear fechas con DatePipe en español
          this.effectiveDate = data.effective_date
            ? this.datePipe.transform(data.effective_date, "d 'de' MMMM 'de' yyyy", undefined, 'es') || 'No disponible'
            : 'No disponible';
          this.updatedAt = data.updated_at
            ? this.datePipe.transform(data.updated_at, "d 'de' MMMM 'de' yyyy HH:mm", undefined, 'es') || 'No disponible'
            : 'No disponible';

          // Actualizar query params solo si es diferente
          if (this.route.snapshot.queryParams['document'] !== normalizedTitle) {
            this.updateQueryParams(normalizedTitle);
          }
        },
        error: (err) => {
          console.error('Error obteniendo la versión del documento:', err);
          this.documentContent = 'Error al cargar el documento.';
        }
      });
  }

  private normalizeDocumentTitle(title: string): string {
    // Convertir a formato estándar (primera letra de cada palabra en mayúscula)
    const lowerTitle = title.toLowerCase();
    for (const [key, value] of Object.entries(this.validDocuments)) {
      if (key.toLowerCase() === lowerTitle) {
        return value;
      }
    }
    return 'Política de Privacidad'; // Documento por defecto
  }

  private updateQueryParams(title: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { document: title },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  formatDocumentContent(content: string): string {
    if (!content) return '<p>No hay contenido disponible.</p>';

    let formattedContent = '<div class="space-y-6">';
    const lines = content.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      if (line.startsWith('¿') || line.includes('?')) {
        formattedContent += `<h3 class="text-lg font-semibold">${line.trim()}</h3>`;
      } else if (line.includes(':')) {
        formattedContent += `<p><strong>${line.split(':')[0]}:</strong> ${line.split(':')[1].trim()}</p>`;
      } else {
        formattedContent += `<p>${line.trim()}</p>`;
      }
    });

    formattedContent += '</div>';
    return formattedContent;
  }
}