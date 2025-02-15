import { Component } from '@angular/core';
import { TemplateService } from '../../services/template.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-email-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-template.component.html',
  styleUrl: './email-template.component.css'
})
export class EmailTemplateComponent {
  emailTemplate: any[] = [];
  selectedEmailType: any = null;

  constructor(private templateService: TemplateService) { }
  ngOnInit(): void {
    this.loadEmailTemplate();
  }
  // Obtener todas las plantillas activas
  loadEmailTemplate() {
    this.templateService.getAllTemplates().subscribe({
      next: (data) => {
        console.log('Datos obtenidos:', data); 
        this.emailTemplate = data; 
        console.log('Asignado a emailTemplate:', this.emailTemplate);
      },
      error: (error) => {
        console.error('Error al obtener plantillas:', error);
      }
    });
  }
  
  // Obtener plantilla por ID
  getEmailTemplateById(id: number): void {
    this.templateService.getEmailTemplateById(id).subscribe({
      next: (data) => {
        this.selectedEmailType = data.emailType;
        console.log('PLantilla seleccioanda:', this.selectedEmailType);
      },
      error: (err) => {
        console.error('Error al obtener la platilla de correo electrónico por ID:', err);
      }
    });
  }
}
