import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CompanyService } from '../../services/company.service';
import { FaqCategoryService, FaqCategory } from '../../services/faq-category.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  companyInfo: any = null;
  categoryIds: { [key: string]: number } = {
    'Envíos': 0,
    'Devoluciones': 0,
    'Métodos de Pago': 0
  };

  constructor(
    public companyService: CompanyService,
    private faqCategoryService: FaqCategoryService
  ) {}

  ngOnInit(): void {
    this.getCompanyInfo();
    this.getCategoryIds();
  }

  getCompanyInfo(): void {
    this.companyService.getCompanyInfo().subscribe({
      next: (response) => {
        this.companyInfo = response.company;
        console.log(this.companyInfo);
      },
      error: (error) => {
        console.error('Error al obtener la información de la empresa:', error);
      }
    });
  }

  getCategoryIds(): void {
    this.faqCategoryService.getPublicCategories().subscribe({
      next: (response: FaqCategory[]) => {
        response.forEach(category => {
          if (category.name === 'Envíos') this.categoryIds['Envíos'] = category.category_id;
          if (category.name === 'Devoluciones') this.categoryIds['Devoluciones'] = category.category_id;
          if (category.name === 'Métodos de Pago') this.categoryIds['Métodos de Pago'] = category.category_id;
        });
      },
      error: (error) => {
        console.error('Error al obtener categorías:', error);
      }
    });
  }
}