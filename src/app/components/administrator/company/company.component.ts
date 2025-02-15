import { Component, OnInit } from '@angular/core';
import { CompanyService } from '../../services/company.service';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [],
  templateUrl: './company.component.html',
  styleUrl: './company.component.css'
})
export class CompanyComponent implements OnInit {
  company: any;
  constructor(private companyService: CompanyService) {
  }

  ngOnInit(): void {
    this.getCompanyInfo();
  }

  getCompanyInfo(): void {
    this.companyService.getCompanyInfo().subscribe(
      (response) => {
        this.company = response.company; 
        console.log('Obtención con éxito:', response);
      },
      (error) => {
        console.error('Error al obtener:', error);
      }
    );
  }
}
