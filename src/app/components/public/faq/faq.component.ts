import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importar FormsModule para ngModel
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
  imports: [CommonModule, FormsModule] // Añadir FormsModule aquí
})
export class FaqComponent implements OnInit {
  faqCategories: FaqCategory[] = [];
  selectedCategory: FaqCategory | null = null;
  isSidebarOpen: boolean = false;
  isDesktopView: boolean = window.innerWidth >= 768; // 768px es el breakpoint de Tailwind para md:
  
  // Variables para paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Variables para búsqueda
  searchQuery: string = '';
  filteredFaqs: Faq[] = [];
  isSearchActive: boolean = false;

  constructor(private faqService: FaqService) {
    // Escuchar cambios en el tamaño de la ventana
    window.addEventListener('resize', () => {
      this.isDesktopView = window.innerWidth >= 768;
    });
  }
  
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
          this.selectCategory(this.faqCategories[0]);
        }
      },
      error: (err) => console.error('[FaqComponent] Error al obtener FAQs:', err)
    });
  }

  selectCategory(category: FaqCategory): void {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.updatePagination(); // Actualizar paginación al seleccionar una categoría
    this.isSidebarOpen = false; // Cerrar el menú después de seleccionar
    console.log('[FaqComponent] Categoría seleccionada:', category.name);
    this.onSearch(); // Aplicar búsqueda al cambiar de categoría
  }

  getPaginatedFaqs(): Faq[] {
    if (!this.selectedCategory) return [];
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.isSearchActive ? this.filteredFaqs.slice(start, end) : this.selectedCategory.faqs.slice(start, end);
  }

  changePage(delta: number): void {
    const newPage = this.currentPage + delta;
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
    }
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  onSearch(): void {
    if (this.searchQuery.trim() === '') {
      this.isSearchActive = false;
      this.filteredFaqs = [];
      this.updatePagination(); // Actualizar paginación cuando no hay búsqueda
      return;
    }

    this.isSearchActive = true;
    const query = this.searchQuery.toLowerCase();

    // Filtrar las FAQs en todas las categorías
    this.filteredFaqs = this.faqCategories
      .flatMap(category => category.faqs)
      .filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        this.faqCategories.find(cat => cat.id === faq.id)?.name.toLowerCase().includes(query)
      );

    this.updatePagination(); // Actualizar paginación después de la búsqueda
    this.currentPage = 1; // Resetear a la primera página después de la búsqueda
  }

  updatePagination(): void {
    if (this.isSearchActive) {
      // Calcular totalPages basado en los resultados filtrados
      this.totalPages = Math.ceil(this.filteredFaqs.length / this.itemsPerPage);
    } else if (this.selectedCategory) {
      // Calcular totalPages basado en las FAQs de la categoría seleccionada
      this.totalPages = Math.ceil(this.selectedCategory.faqs.length / this.itemsPerPage);
    } else {
      // Si no hay categoría seleccionada ni búsqueda, no hay páginas
      this.totalPages = 1;
    }
  }
}