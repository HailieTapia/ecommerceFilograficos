import { Component, OnInit, LOCALE_ID } from '@angular/core';
import { RegulatoryService } from '../../services/regulatory.service';
import { CommonModule, DatePipe } from '@angular/common';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe'; // Ajusta la ruta si es necesario

// Registrar los datos de localización para español
registerLocaleData(localeEs);

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule, DatePipe, SafeHtmlPipe], // Importa el pipe standalone
  templateUrl: './legal.component.html',
  styleUrl: './legal.component.css',
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
})
export class LegalComponent implements OnInit {
  documentContent: string | null = null;
  documentTitle: string = '';
  documentVersion: string | null = null;
  effectiveDate: string | null = null;
  updatedAt: string | null = null;
  selectedDocument: string = '';

  constructor(
    private regulatoriosService: RegulatoryService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    // Cargar automáticamente "Política de Privacidad" al inicializar el componente
    this.loadDocument('Política de Privacidad');
  }

  // Obtener el documento
  loadDocument(title: string): void {
    this.documentTitle = title;
    this.selectedDocument = title;
    this.documentContent = null;
    this.documentVersion = null;
    this.effectiveDate = null;
    this.updatedAt = null;

    this.regulatoriosService.getCurrentVersion(title).subscribe({
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
      },
      error: (err) => {
        console.error('Error obteniendo la versión del documento:', err);
        this.documentContent = 'Error al cargar el documento.';
      }
    });
  }

  // Formatear el contenido del documento
  formatDocumentContent(content: string): string {
    if (!content) return '<p>No hay contenido disponible.</p>';

    // Dividir el texto en secciones basadas en preguntas o títulos
    let formattedContent = '<div class="space-y-6">';
    const lines = content.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      if (line.startsWith('¿') || line.includes('?')) {
        formattedContent += `<h3 class="text-lg font-semibold text-gray-800">${line.trim()}</h3>`;
      } else if (line.includes(':')) {
        formattedContent += `<p class="text-gray-700"><strong>${line.split(':')[0]}:</strong> ${line.split(':')[1].trim()}</p>`;
      } else {
        formattedContent += `<p class="text-gray-700">${line.trim()}</p>`;
      }
    });

    formattedContent += '</div>';
    return formattedContent;
  }
}