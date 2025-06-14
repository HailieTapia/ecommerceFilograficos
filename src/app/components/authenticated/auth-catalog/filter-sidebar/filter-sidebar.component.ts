import { Component, EventEmitter, Output, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategorieService } from '../../../services/categorieService';
import { CollaboratorsService } from '../../../services/collaborators.service';
import { ToastService } from '../../../services/toastService';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-sidebar.component.html',
  styleUrl: './filter-sidebar.component.css'
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
    collaboratorId: null,
    onlyOffers: null
  };

  constructor(
    private toastService: ToastService,
    private categoriesService: CategorieService,
    private collaboratorService: CollaboratorsService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadCollaborators();
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
      collaboratorId: this.initialFilters.collaboratorId ?? null,
      onlyOffers: this.initialFilters.onlyOffers ?? null
    };
  }

  loadCategories(): void {
    this.categoriesService.authCategories().subscribe({
      next: (response) => {
        this.categories = response;
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'No se pudo cargar las categorías. Por favor, intenta de nuevo.';
        this.toastService.showToast(errorMessage, 'error');
        this.categories = [];
      }
    });
  }

  loadCollaborators(): void {
    this.collaboratorService.getAuthCollaborators().subscribe({
      next: (response) => {
        this.collaborators = response;
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'No se pudo cargar los colaboradores. Por favor, intenta de nuevo.';
        this.toastService.showToast(errorMessage, 'error');
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
    if (this.filters.onlyOffers !== null) {
      cleanedFilters.onlyOffers = this.filters.onlyOffers;
    }
    this.filtersChange.emit(cleanedFilters);
  }

  clearFilters(): void {
    this.filters = {
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      collaboratorId: null,
      onlyOffers: null
    };
    this.applyFilters();
  }
}