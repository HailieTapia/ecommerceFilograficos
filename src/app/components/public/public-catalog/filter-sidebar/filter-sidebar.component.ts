import { Component, EventEmitter, Output, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
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
export class FilterSidebarComponent implements OnInit, OnChanges {
  @Input() initialFilters: any = {};
  @Output() filtersChange = new EventEmitter<any>();

  categories: any[] = [];
  collaborators: any[] = [];
  filters: any = {
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    collaboratorId: null
  };

  constructor(
    private categoriesService: CategorieService,
    private collaboratorService: CollaboratorsService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadCollaborators();
    // Inicializar filtros desde initialFilters
    this.updateFiltersFromInput();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialFilters'] && changes['initialFilters'].currentValue) {
      this.updateFiltersFromInput();
    }
  }

  private updateFiltersFromInput(): void {
    this.filters = {
      categoryId: this.initialFilters.categoryId ?? null,
      minPrice: this.initialFilters.minPrice ?? null,
      maxPrice: this.initialFilters.maxPrice ?? null,
      collaboratorId: this.initialFilters.collaboratorId ?? null
    };
  }

  loadCategories(): void {
    this.categoriesService.publicCategories().subscribe({
      next: (response) => {
        this.categories = response;
      },
      error: (error) => {
        console.error('Error al cargar las categorías:', error);
        this.categories = [];
      }
    });
  }

  loadCollaborators(): void {
    this.collaboratorService.getPublicCollaborators().subscribe({
      next: (response) => {
        this.collaborators = response;
      },
      error: (error) => {
        console.error('Error al cargar los colaboradores:', error);
        this.collaborators = [];
      }
    });
  }

  applyFilters(): void {
    const cleanedFilters: any = {};
    if (this.filters.categoryId !== null) {
      cleanedFilters.categoryId = this.filters.categoryId;
    }
    if (this.filters.minPrice !== null) {
      cleanedFilters.minPrice = this.filters.minPrice;
    }
    if (this.filters.maxPrice !== null) {
      cleanedFilters.maxPrice = this.filters.maxPrice;
    }
    if (this.filters.collaboratorId !== null) {
      cleanedFilters.collaboratorId = this.filters.collaboratorId;
    }
    this.filtersChange.emit(cleanedFilters);
  }

  clearFilters(): void {
    this.filters = {
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      collaboratorId: null
    };
    this.applyFilters();
  }
}