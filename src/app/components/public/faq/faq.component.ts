import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaqService } from '../../services/faq.service';

interface Faq {
  id: number;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

interface FaqCategory {
  id: number;
  name: string;
  description: string;
  faqs: Faq[];
}

@Component({
  selector: 'app-faq',
  standalone: true,
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css'],
  imports: [CommonModule]
})
export class FaqComponent implements OnInit {
  faqCategories: FaqCategory[] = [];
  expandedCategoryId: number | null = null;

  constructor(private faqService: FaqService) {}

  ngOnInit(): void {
    console.log('[FaqComponent] Inicializando...');
    this.getAllFaqs();
  }

  getAllFaqs(): void {
    console.log('[FaqComponent] Obteniendo preguntas frecuentes...');
    this.faqService.getAllFaqs().subscribe({
      next: (response: FaqCategory[]) => {
        console.log('[FaqComponent] Datos recibidos:', response);
        this.faqCategories = response;
      },
      error: (err) => console.error('[FaqComponent] Error al obtener FAQs:', err)
    });
  }

  toggleCategory(categoryId: number): void {
    this.expandedCategoryId = this.expandedCategoryId === categoryId ? null : categoryId;
    console.log('[FaqComponent] Alternando categoría:', categoryId);
  }
}
