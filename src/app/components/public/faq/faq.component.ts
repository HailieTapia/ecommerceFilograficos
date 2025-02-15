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
  selectedCategory: FaqCategory | null = null;
  
  // Variables para paginación
  currentPage: number = 1;
  itemsPerPage: number = 10; // Máximo de preguntas por página
  totalPages: number = 1;

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
        if (this.faqCategories.length > 0) {
          this.selectCategory(this.faqCategories[0]); // Primera categoría seleccionada por defecto
        }
      },
      error: (err) => console.error('[FaqComponent] Error al obtener FAQs:', err)
    });
  }

  selectCategory(category: FaqCategory): void {
    this.selectedCategory = category;
    this.currentPage = 1; // Reiniciar a la primera página
    this.totalPages = Math.ceil(category.faqs.length / this.itemsPerPage);
    console.log('[FaqComponent] Categoría seleccionada:', category.name);
  }

  getPaginatedFaqs(): Faq[] {
    if (!this.selectedCategory) return [];
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.selectedCategory.faqs.slice(start, end);
  }

  changePage(delta: number): void {
    if (!this.selectedCategory) return;
    const newPage = this.currentPage + delta;
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
    }
  }
}
