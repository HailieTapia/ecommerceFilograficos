import { Component } from '@angular/core';
import { RegulatoryService } from '../../services/regulatory.service';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './legal.component.html',
  styleUrl: './legal.component.css'
})
export class LegalComponent {
documentContent: string | null = null;
documentTitle: string = '';
documentVersion: string | null = null;
effectiveDate: string | null = null;
updatedAt: string | null = null;
selectedDocument: string = '';

constructor(private regulatoriosService: RegulatoryService) { }

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

      // Asignar fechas y versión general del documento
      this.effectiveDate = data.effective_date || 'No disponible';
      this.updatedAt = data.updated_at || 'No disponible';
    },
    error: (err) => {
      console.error('Error obteniendo la versión del documento:', err);
      this.documentContent = 'Error al cargar el documento.';
    }
  });
}
}
