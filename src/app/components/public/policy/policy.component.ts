import { Component } from '@angular/core';
import { RegulatoryService } from '../../services/regulatory.service';
@Component({
  selector: 'app-policy',
  standalone: true,
  imports: [],
  templateUrl: './policy.component.html',
  styleUrl: './policy.component.css'
})
export class PolicyComponent {
  policy: any;
  titulo: string = '';
  versionDocumento: string = '';
  fechaVigencia: string = '';
  constructor(private regulatoriosService: RegulatoryService) { }
  ngOnInit(): void {
    this.getDocumentos();
  }
  // Obtener los documentos
  getDocumentos(): void {
    // Obtener las politicas
    this.regulatoriosService.getCurrentVersion('Política de privacidad').subscribe(
      (data) => {
        console.log(data);
        this.policy = data.contenido;
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
