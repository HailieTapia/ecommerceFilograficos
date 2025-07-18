import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FaqService, Faq, FaqResponse } from '../../services/faq.service';
import { FaqCategoryService, FaqCategory } from '../../services/faq-category.service';
import { Subscription } from 'rxjs';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-faq',
  standalone: true,
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css'],
  imports: [CommonModule, FormsModule, SpinnerComponent, RouterModule],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out')),
    ]),
  ],
})
export class FaqComponent implements OnInit, OnDestroy {
  faqs: (Faq & { isExpanded: boolean })[] = [];
  totalFaqs = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searchQuery = '';
  selectedCategoryId: number | null = null;
  categories: { id: number; name: string; description: string }[] = [];
  isSidebarOpen = false;
  isDesktopView = window.innerWidth >= 768;
  isLoading = false;
  errorMessage: string = '';
  private subscriptions: Subscription = new Subscription();

  constructor(
    private faqService: FaqService,
    private faqCategoryService: FaqCategoryService,
    private route: ActivatedRoute
  ) {
    window.addEventListener('resize', () => {
      this.isDesktopView = window.innerWidth >= 768;
      if (this.isDesktopView) this.isSidebarOpen = false;
    });
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.queryParams.subscribe(params => {
        const categoryId = params['categoryId'];
        if (categoryId) {
          this.selectedCategoryId = +categoryId; // Convertir a número
          this.currentPage = 1;
        }
        this.loadCategories();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadFaqs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const params = {
      page: this.currentPage,
      pageSize: this.itemsPerPage,
      search: this.searchQuery.trim(),
      categoryId: this.selectedCategoryId || undefined,
      grouped: false,
    };

    this.subscriptions.add(
      this.faqService.getAllFaqs(params, false).subscribe({
        next: (response: FaqResponse) => {
          this.faqs = (response.faqs as Faq[]).map(faq => ({ ...faq, isExpanded: false }));
          this.totalFaqs = response.total;
          this.totalPages = Math.ceil(response.total / this.itemsPerPage);
          this.isLoading = false;
        },
        error: (err: any) => {
          this.errorMessage = 'Error al cargar las preguntas frecuentes. Por favor, intenta de nuevo.';
          console.error('[FaqComponent] Error al obtener FAQs:', err);
          this.isLoading = false;
        },
      })
    );
  }

  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.subscriptions.add(
      this.faqCategoryService.getPublicCategories().subscribe({
        next: (response: FaqCategory[]) => {
          this.categories = response.map((cat: FaqCategory) => ({
            id: cat.category_id,
            name: cat.name,
            description: '',
          }));
          this.isLoading = false;
          // Validar selectedCategoryId
          if (this.selectedCategoryId && !this.categories.some(cat => cat.id === this.selectedCategoryId)) {
            this.selectedCategoryId = null;
            this.errorMessage = 'La categoría seleccionada no existe.';
          }
          this.loadFaqs(); // Cargar FAQs después de cargar categorías
        },
        error: (err: any) => {
          this.errorMessage = 'Error al cargar las categorías. Por favor, intenta de nuevo.';
          console.error('[FaqComponent] Error al obtener categorías:', err);
          this.isLoading = false;
        },
      })
    );
  }

  selectCategory(categoryId: number): void {
    this.selectedCategoryId = categoryId;
    this.currentPage = 1;
    this.isSidebarOpen = false;
    this.loadFaqs();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadFaqs();
    }
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadFaqs();
  }

  onSearch(): void {
    if (this.searchQuery.length > 0 && this.searchQuery.length < 3) {
      return;
    }
    this.currentPage = 1;
    this.loadFaqs();
  }

  getSelectedCategoryName(): string {
    if (!this.selectedCategoryId) return 'Todas las categorías';
    const category = this.categories.find(cat => cat.id === this.selectedCategoryId);
    return category ? category.name : 'Todas las categorías';
  }

  getSelectedCategoryDescription(): string {
    if (!this.selectedCategoryId) return 'Selecciona una categoría o busca una pregunta para ver las respuestas.';
    const category = this.categories.find(cat => cat.id === this.selectedCategoryId);
    return category ? category.description : 'Selecciona una categoría para ver las preguntas frecuentes.';
  }

  trackByFaqId(index: number, faq: Faq & { isExpanded: boolean }): number {
    return faq.id;
  }

  trackByCategoryId(index: number, category: { id: number }): number {
    return category.id;
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }
}