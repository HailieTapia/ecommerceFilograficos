import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategorieService } from '../../../services/categorieService';
import { CollaboratorsService } from '../../../services/collaborators.service';
import { take } from 'rxjs/operators';

// Interfaces
interface Category {
  category_id: number;
  name: string;
}

interface Collaborator {
  collaborator_id: number;
  name: string;
}

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.css']
})
export class FilterSidebarComponent implements OnInit, OnChanges {
  @Input() initialFilters: {
    categoryId: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    collaboratorId: number | null;
    onlyOffers: boolean;
    sort: string | null;
  } = {
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    collaboratorId: null,
    onlyOffers: false,
    sort: null
  };
  @Input() showCollaboratorFilter: boolean = false;
  @Output() filtersChange = new EventEmitter<any>();

  categories: Category[] = [];
  collaborators: Collaborator[] = [];
  filters: {
    categoryId: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    collaboratorId: number | null;
    onlyOffers: boolean;
  } = {
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    collaboratorId: null,
    onlyOffers: false
  };

  constructor(
    private categorieService: CategorieService,
    private collaboratorService: CollaboratorsService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    if (this.showCollaboratorFilter) {
      this.loadCollaborators();
    }
    this.updateFiltersFromInput();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialFilters'] && changes['initialFilters'].currentValue) {
      this.updateFiltersFromInput();
    }
    if (changes['showCollaboratorFilter'] && !changes['showCollaboratorFilter'].currentValue) {
      this.filters.collaboratorId = null;
      this.collaborators = [];
    }
  }

  private updateFiltersFromInput(): void {
    this.filters = {
      categoryId: this.initialFilters.categoryId || null,
      minPrice: this.initialFilters.minPrice || null,
      maxPrice: this.initialFilters.maxPrice || null,
      collaboratorId: this.showCollaboratorFilter ? this.initialFilters.collaboratorId || null : null,
      onlyOffers: this.initialFilters.onlyOffers || false
    };
  }

  loadCategories(): void {
    this.categorieService.publicCategories().pipe(take(1)).subscribe({
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
    this.collaboratorService.getAuthCollaborators().pipe(take(1)).subscribe({
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
    if (this.filters.categoryId !== null) cleanedFilters.categoryId = this.filters.categoryId;
    if (this.filters.minPrice !== null) cleanedFilters.minPrice = this.filters.minPrice;
    if (this.filters.maxPrice !== null) cleanedFilters.maxPrice = this.filters.maxPrice;
    if (this.showCollaboratorFilter && this.filters.collaboratorId !== null) cleanedFilters.collaboratorId = this.filters.collaboratorId;
    if (this.filters.onlyOffers) cleanedFilters.onlyOffers = this.filters.onlyOffers;
    this.filtersChange.emit(cleanedFilters);
  }

  resetFilters(): void {
    this.filters = {
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      collaboratorId: null,
      onlyOffers: false
    };
    
    this.filtersChange.emit({
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      collaboratorId: null,
      onlyOffers: false
    });
  }

  applyPriceFilters(): void {
    // Validate non-negative values
    if (this.filters.minPrice !== null && this.filters.minPrice < 0) {
      this.filters.minPrice = null;
    }
    if (this.filters.maxPrice !== null && this.filters.maxPrice < 0) {
      this.filters.maxPrice = null;
    }
    // Swap min and max if min is greater than max
    if (this.filters.minPrice !== null && this.filters.maxPrice !== null && this.filters.minPrice > this.filters.maxPrice) {
      [this.filters.minPrice, this.filters.maxPrice] = [this.filters.maxPrice, this.filters.minPrice];
    }
    this.applyFilters();
  }

  onPriceKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.applyPriceFilters();
    }
  }
}