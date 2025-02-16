import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FaqService } from '../../services/faq.service';
import { FaqFormComponent } from './faq-form/faq-form.component';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs'; // Importar Subscription de RxJS

export interface Faq {
  faq_id: number;  // Nombre y tipo que espera el backend
  question: string;
  answer: string;
  category_id: number;  // Campo necesario para las relaciones
  createdAt: string;
  updatedAt: string;
}

export interface FaqCategory {
  category_id: number;  // Nombre y tipo que espera el backend
  name: string;
  description: string;
  faqs: Faq[];
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  standalone: true,
  styleUrls: ['./faq.component.css'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FormsModule
  ]
})
export class FaqComponentAdmin implements OnInit, OnDestroy {
  categories: FaqCategory[] = [];
  searchQuery: string = '';
  selectedCategory: FaqCategory | null = null;
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  filteredFaqs: Faq[] = [];
  isSearchActive: boolean = false;
  private subscriptions: Subscription = new Subscription(); // Declarar e inicializar subscriptions

  constructor(private faqService: FaqService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.getFaqs();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe(); // Asegurarse de desuscribirse al destruir el componente
  }

  getFaqs(): void {
    this.subscriptions.add( // Agregar la suscripción al manejador
      this.faqService.getAllFaqs().subscribe({
        next: (data) => {
          if (data && Array.isArray(data)) {
            this.categories = data;
            this.updatePagination();
          }
        },
        error: (err) => console.error('Error al obtener FAQs:', err)
      })
    );
  }

  openFormDialog(faq?: Faq, category?: FaqCategory): void {
    const dialogRef = this.dialog.open(FaqFormComponent, {
      width: '500px',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      autoFocus: false,
      data: {
        faq: faq ? { ...faq } : null, // Asegúrate de que el `id` esté incluido
        category: category ? { ...category } : null
      },
    });
  
    this.subscriptions.add(
      dialogRef.afterClosed().subscribe((result) => {
        if (result) this.getFaqs(); // Actualiza la lista después de cerrar el modal
      })
    );
  }

  deleteFaq(id: number): void { // Usar number en lugar de string
    if (confirm('¿Estás seguro de eliminar esta pregunta?')) {
      this.subscriptions.add(
        this.faqService.deleteFaq(id.toString()) // Asegurar conversión si el backend necesita string
          .subscribe({
            next: () => this.getFaqs(),
            error: (err) => console.error('Error al eliminar:', err)
          })
      );
    }
  }

  onSearch(): void {
    this.searchQuery = this.searchQuery.trim().toLowerCase();
    
    if (this.searchQuery.length < 3) {
      this.isSearchActive = false;
      this.filteredFaqs = [];
      this.updatePagination();
      return;
    }

    this.isSearchActive = true;
    this.filteredFaqs = this.categories
      .flatMap(category => category.faqs)
      .filter(faq => 
        faq.question.toLowerCase().includes(this.searchQuery) ||
        faq.answer.toLowerCase().includes(this.searchQuery)
      );
    
    this.updatePagination();
    this.currentPage = 1;
  }

  selectCategory(category: FaqCategory | null): void {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    let totalItems = 0;
    
    if (this.isSearchActive) {
      totalItems = this.filteredFaqs.length;
    } else if (this.selectedCategory) {
      totalItems = this.selectedCategory.faqs.length;
    } else {
      // Si no hay categoría seleccionada, cuenta todas las FAQs
      totalItems = this.categories.flatMap(c => c.faqs).length;
    }
    
    this.totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
  }

  getPaginatedFaqs(): Faq[] {
    let faqs: Faq[] = [];
    
    if (this.isSearchActive) {
      // Si hay búsqueda activa, usa los FAQs filtrados
      faqs = this.filteredFaqs;
    } else if (this.selectedCategory) {
      // Si hay una categoría seleccionada, usa los FAQs de esa categoría
      faqs = this.selectedCategory.faqs;
    } else {
      // Si no hay categoría seleccionada, muestra todas las FAQs de todas las categorías
      faqs = this.categories.flatMap(c => c.faqs);
    }
    
    // Aplica paginación
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return faqs.slice(start, end);
  }

  changePage(delta: number): void {
    const newPage = this.currentPage + delta;
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
    }
  }

  findCategoryByFaq(faq: Faq): FaqCategory | undefined {
    return this.categories.find(category => 
      category.faqs.some(f => f.faq_id === faq.faq_id) // Usar faq_id
    );
  }
}