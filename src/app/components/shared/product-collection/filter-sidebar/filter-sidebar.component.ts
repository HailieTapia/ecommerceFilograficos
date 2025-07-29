import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategorieService } from '../../../services/categorieService';
import { CollaboratorsService } from '../../../services/collaborators.service';
import { take } from 'rxjs/operators';

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
  @Input() initialFilters = {
    categoryId: null as number | null,
    minPrice: null as number | null,
    maxPrice: null as number | null,
    collaboratorId: null as number | null,
    onlyOffers: false,
    averageRating: null as number | null
  };
  @Input() showCollaboratorFilter = false;
  @Input() isModal = false;
  @Output() filtersChange = new EventEmitter<any>();

  categories: Category[] = [];
  collaborators: Collaborator[] = [];
  filters = {
    categoryId: null as number | null,
    minPrice: null as number | null,
    maxPrice: null as number | null,
    collaboratorId: null as number | null,
    onlyOffers: false,
    averageRating: null as number | null
  };

  constructor(
    private categorieService: CategorieService,
    private collaboratorService: CollaboratorsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    if (this.showCollaboratorFilter) {
      this.loadCollaborators();
    }
    this.updateFiltersFromInput();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialFilters']) {
      this.updateFiltersFromInput();
    }
    if (changes['showCollaboratorFilter'] && !changes['showCollaboratorFilter'].currentValue) {
      this.filters.collaboratorId = null;
      this.collaborators = [];
    }
  }

  private updateFiltersFromInput(): void {
    this.filters = {
      categoryId: this.initialFilters.categoryId,
      minPrice: this.initialFilters.minPrice,
      maxPrice: this.initialFilters.maxPrice,
      collaboratorId: this.showCollaboratorFilter ? this.initialFilters.collaboratorId : null,
      onlyOffers: this.initialFilters.onlyOffers,
      averageRating: this.initialFilters.averageRating
    };
    this.cdr.detectChanges(); // Force change detection after updating filters
  }

  loadCategories(): void {
    this.categorieService.publicCategories().pipe(take(1)).subscribe({
      next: (response) => {
        this.categories = response;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar las categorías:', error);
        this.categories = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadCollaborators(): void {
    this.collaboratorService.getAuthCollaborators().pipe(take(1)).subscribe({
      next: (response) => {
        this.collaborators = response;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar los colaboradores:', error);
        this.collaborators = [];
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    // Create a fresh object to ensure change detection
    const cleanedFilters: any = {
      categoryId: this.filters.categoryId,
      minPrice: this.filters.minPrice,
      maxPrice: this.filters.maxPrice,
      collaboratorId: this.showCollaboratorFilter ? this.filters.collaboratorId : null,
      onlyOffers: this.filters.onlyOffers ? true : undefined,
      averageRating: this.filters.averageRating
    };

    // Remove undefined or null values, but explicitly include null for categoryId and averageRating
    Object.keys(cleanedFilters).forEach(key => {
      if (cleanedFilters[key] === undefined && key !== 'categoryId' && key !== 'averageRating') {
        delete cleanedFilters[key];
      }
    });

    this.filtersChange.emit(cleanedFilters);
    this.cdr.detectChanges(); // Ensure UI updates after emitting
  }

  resetFilters(): void {
    this.filters = {
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      collaboratorId: null,
      onlyOffers: false,
      averageRating: null
    };
    
    this.filtersChange.emit(this.filters);
    this.cdr.detectChanges();
  }

  applyPriceFilters(): void {
    if (this.filters.minPrice !== null && this.filters.minPrice < 0) {
      this.filters.minPrice = null;
    }
    if (this.filters.maxPrice !== null && this.filters.maxPrice < 0) {
      this.filters.maxPrice = null;
    }
    if (this.filters.minPrice !== null && this.filters.maxPrice !== null && 
        this.filters.minPrice > this.filters.maxPrice) {
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