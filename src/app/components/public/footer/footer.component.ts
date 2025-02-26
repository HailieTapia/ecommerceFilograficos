import { Component, OnInit } from '@angular/core';
import { CompanyService } from '../../services/company.service';
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  companyInfo: any = null;
  constructor(
    private companyService: CompanyService
  ) { }
  ngOnInit(): void {
    this.getCompanyInfo();
  }
  // Obtener la información de la empresa 
  getCompanyInfo(): void {
    this.companyService.getCompanyInfo().subscribe(
      (response) => {
        this.companyInfo = response.company;
        console.log('footer:', response);
      },
      (error) => {
        console.error('Error al obtener:', error);
      }
    );
  }
}