import { Component, OnInit } from '@angular/core';
import { CompanyService } from '../../services/company.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  companyInfo: any = null;

  constructor(public companyService: CompanyService) {} // Changed from private to public

  ngOnInit(): void {
    this.getCompanyInfo();
  }

  // Obtener la información de la empresa 
  getCompanyInfo(): void {
    this.companyService.getCompanyInfo().subscribe({
      next: (response) => {
        this.companyInfo = response.company;
      },
      error: (error) => {
        console.error('Error al obtener la información de la empresa:', error);
      }
    });
  }
}