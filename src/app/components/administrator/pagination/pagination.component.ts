import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class PaginationComponent {
  @Input() currentPage: number = 1; // Página actual
  @Input() totalItems: number = 0; // Total de elementos
  @Input() itemsPerPage: number = 10; // Elementos por página
  @Output() pageChange = new EventEmitter<number>(); // Evento al cambiar de página

  // Calcula el número total de páginas
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  // Índice del primer elemento de la página actual
  get indexOfFirstItem(): number {
    return (this.currentPage - 1) * this.itemsPerPage;
  }

  // Índice del último elemento de la página actual
  get indexOfLastItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  // Navegar a una página específica
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.pageChange.emit(page);
    }
  }

  // Navegar a la página anterior
  goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  // Navegar a la página siguiente
  goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  // Generar botones de paginación
  getPages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const totalPages = this.totalPages;

    // Siempre mostrar la primera página
    pages.push(1);

    // Lógica para páginas intermedias
    if (totalPages <= 7) {
      for (let i = 2; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage > 3) {
        pages.push('...');
      }

      for (
        let i = Math.max(2, this.currentPage - 1);
        i <= Math.min(totalPages - 1, this.currentPage + 1);
        i++
      ) {
        pages.push(i);
      }

      if (this.currentPage < totalPages - 2) {
        pages.push('...');
      }
    }

    // Siempre mostrar la última página si hay más de una
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }
}