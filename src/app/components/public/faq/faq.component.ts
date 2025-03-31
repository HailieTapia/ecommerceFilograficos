import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaqService, Faq, FaqResponse } from '../../services/faq.service';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-faq',
  standalone: true,
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css'],
  imports: [CommonModule, FormsModule],
})
export class FaqComponent implements OnInit, OnDestroy {
  faqs: Faq[] = [];
  totalFaqs = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searchQuery = '';
  selectedCategoryId: number | null = null;
  categories: { id: number; name: string; description: string }[] = [];
  isSidebarOpen = false;
  isDesktopView = window.innerWidth >= 768;
  private subscriptions: Subscription = new Subscription();

  constructor(private faqService: FaqService) {
    window.addEventListener('resize', () => {
      this.isDesktopView = window.innerWidth >= 768;
    });
  }

  ngOnInit(): void {
    console.log('[FaqComponent] Inicializando...');
    this.loadCategories();
    this.loadFaqs();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadFaqs(): void {
    const params = {
      page: this.currentPage,
      pageSize: this.itemsPerPage,
      search: this.searchQuery.trim(),
      categoryId: this.selectedCategoryId || undefined,
      grouped: false,
    };

    this.subscriptions.add(
      this.faqService.getAllFaqs(params).subscribe({
        next: (response: FaqResponse) => {
          console.log('[FaqComponent] Datos recibidos:', response);
          this.faqs = response.faqs as Faq[];
          this.totalFaqs = response.total;
          this.totalPages = Math.ceil(response.total / this.itemsPerPage);
          if (!this.selectedCategoryId && this.categories.length > 0) {
            this.selectedCategoryId = this.categories[0].id; // Seleccionar la primera categoría por defecto
          }
        },
        error: (err) => console.error('[FaqComponent] Error al obtener FAQs:', err),
      })
    );
  }

  loadCategories(): void {
    this.subscriptions.add(
      this.faqService.getAllFaqs({ grouped: true }).subscribe({
        next: (response: FaqResponse) => {
          this.categories = (response.faqs as any[]).map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
          }));
        },
        error: (err) => console.error('[FaqComponent] Error al obtener categorías:', err),
      })
    );
  }

  selectCategory(categoryId: number): void {
    this.selectedCategoryId = categoryId;
    this.currentPage = 1;
    this.isSidebarOpen = false;
    console.log('[FaqComponent] Categoría seleccionada:', this.selectedCategoryId);
    this.loadFaqs();
  }

  changePage(delta: number): void {
    const newPage = this.currentPage + delta;
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.loadFaqs();
    }
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  onSearch(): void {
    this.currentPage = 1;
    this.debounceSearch().subscribe(() => this.loadFaqs());
  }

  debounceSearch() {
    return of(this.searchQuery).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(() => of(null))
    );
  }

  getSelectedCategoryName(): string {
    const category = this.categories.find(cat => cat.id === this.selectedCategoryId);
    return category ? category.name : '';
  }

  getSelectedCategoryDescription(): string {
    const category = this.categories.find(cat => cat.id === this.selectedCategoryId);
    return category ? category.description : '';
  }
}