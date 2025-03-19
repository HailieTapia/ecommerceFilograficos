import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategorieService } from '../../../services/categorieService';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.css']
})
export class FilterSidebarComponent implements OnInit {
  @Output() filtersChange = new EventEmitter<any>();
  filters: any = {
    categoryId: '',
    minPrice: '',
    maxPrice: ''
  };


  categories: any[] = []; // Lista de categorías obtenidas del backend

  constructor(private categoriesService: CategorieService) {} // Inyectamos HttpClient

  ngOnInit() {
    // Obtener las categorías del backend al inicializar el componente
    this.loadCategories();
  }

  loadCategories() {
    this.categoriesService
      .publicCategories(
      ).subscribe({
      next: (response) => {
        this.categories = response; 
      },
      error: (error) => {
        console.error('Error al cargar las categorías:', error);
        this.categories = []; // En caso de error, dejamos la lista vacía
      }
    });
  }

  applyFilters() {
    const cleanedFilters: any = {};
    if (this.filters.categoryId) {
      cleanedFilters.categoryId = this.filters.categoryId;
    }
    if (this.filters.minPrice) {
      cleanedFilters.minPrice = this.filters.minPrice;
    }
    if (this.filters.maxPrice) {
      cleanedFilters.maxPrice = this.filters.maxPrice;
    }

    this.filtersChange.emit(cleanedFilters); 
  }

  clearFilters() {
    this.filters = {
      categoryId: '',
      minPrice: '',
      maxPrice: ''
    };
    this.applyFilters();
  }
}