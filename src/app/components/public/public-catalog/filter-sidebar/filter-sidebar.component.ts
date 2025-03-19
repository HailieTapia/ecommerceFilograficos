import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategorieService } from '../../../services/categorieService';
import { CollaboratorsService } from '../../../services/collaborators.service';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.css']
})
export class FilterSidebarComponent implements OnInit {
  categories: any[] = [];
  collaborators: any[] = [];

  @Output() filtersChange = new EventEmitter<any>();
  filters: any = {
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    collaboratorId: ''
  };
  constructor(private categoriesService: CategorieService, private collaboratorService: CollaboratorsService) { }

  ngOnInit() {
    this.loadCategories();
    this.loadCollaborators();
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
  loadCollaborators() {
    this.collaboratorService.getPublicCollaborators().subscribe({
      next: (response) => {
        console.log(response);
        this.collaborators = response;
      },
      error: (error) => {
        console.error('Error al cargar los colaboradores:', error);
        this.collaborators = [];
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
    if (this.filters.collaboratorId) {
      cleanedFilters.collaboratorId = this.filters.collaboratorId; 
    }
    this.filtersChange.emit(cleanedFilters);
  }

  clearFilters() {
    this.filters = {
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      collaboratorId: ''
    };
    this.applyFilters();
  }
}