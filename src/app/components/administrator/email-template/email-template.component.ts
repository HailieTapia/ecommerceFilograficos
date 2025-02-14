import { Component } from '@angular/core';
import { TemplateService } from '../../services/template.service';

@Component({
  selector: 'app-email-template',
  standalone: true,
  imports: [],
  templateUrl: './email-template.component.html',
  styleUrl: './email-template.component.css'
})
export class EmailTemplateComponent {
  emailTemplate: any[] = [];

  constructor(private templateService: TemplateService) { }
  ngOnInit(): void {
    this.loadEmailTypes();
  }
  // Cargar todos los tipos de email
  loadEmailTypes(): void {
    this.templateService.getAllTemplates().subscribe({
      next: (data) => {
        console.log(data);
        this.emailTemplate = data.emailTemplate;
      },
      error: (err) => {
        console.error('Error fetching email types:', err);
      }
    });
  }
}
