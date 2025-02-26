import { Component } from '@angular/core';
import { RegulatoryService } from '../../services/regulatory.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.css'
})
export class TermsComponent {
  terminosCondiciones: any;
  titulo: string = '';
  versionDocumento: string = '';
  fechaVigencia: string = '';
  constructor(private regulatoriosService: RegulatoryService) { }
  ngOnInit(): void {
    this.getDocumentos();
  }
  // Obtener los documentos
  getDocumentos(): void {
    // Obtener los Términos y Condiciones
    this.regulatoriosService.getCurrentVersion('Términos y condiciones').subscribe(
      (data) => {
        console.log(data);
        this.terminosCondiciones = data.contenido;
        this.titulo = data.titulo;
        this.versionDocumento = data.version;
        this.fechaVigencia = data.fecha_vigencia;
      },
      (error) => {
        console.error('Error al obtener el deslinde', error);
      }
    );
  }
}

