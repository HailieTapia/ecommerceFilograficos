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
  categories: any[] = [];

  @Output() filtersChange = new EventEmitter<any>();
  filters: any = {
    categoryId: '',
    minPrice: '',
    maxPrice: ''
  };


  constructor(private categoriesService: CategorieService) { }

  ngOnInit() {
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
        this.categories = []; 
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