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
  id: number;
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
    search: string | null;
    sort: string | null;
  } = {
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    collaboratorId: null,
    search: null,
    sort: null
  };
  @Input() showCollaboratorFilter: boolean = false;
  @Output() filtersChange = new EventEmitter<any>();

  categories: Category[] = [];
  collaborators: Collaborator[] = [];
  search: string = '';
  selectedCategory: number | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  selectedCollaborator: number | null = null;

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
      this.selectedCollaborator = null;
      this.collaborators = [];
    }
  }

  private updateFiltersFromInput(): void {
    this.search = this.initialFilters.search || '';
    this.selectedCategory = this.initialFilters.categoryId || null;
    this.minPrice = this.initialFilters.minPrice || null;
    this.maxPrice = this.initialFilters.maxPrice || null;
    this.selectedCollaborator = this.showCollaboratorFilter ? this.initialFilters.collaboratorId || null : null;
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
    if (this.selectedCategory !== null) cleanedFilters.categoryId = this.selectedCategory;
    if (this.minPrice !== null) cleanedFilters.minPrice = this.minPrice;
    if (this.maxPrice !== null) cleanedFilters.maxPrice = this.maxPrice;
    if (this.showCollaboratorFilter && this.selectedCollaborator !== null) cleanedFilters.collaboratorId = this.selectedCollaborator;
    if (this.search.trim()) cleanedFilters.search = this.search.trim();
    this.filtersChange.emit(cleanedFilters);
  }

  resetFilters(): void {
    this.search = '';
    this.selectedCategory = null;
    this.minPrice = null;
    this.maxPrice = null;
    this.selectedCollaborator = null;
    this.applyFilters();
  }
}