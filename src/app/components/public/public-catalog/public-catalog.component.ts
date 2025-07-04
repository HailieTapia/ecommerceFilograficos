import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicProductService, ProductResponse } from '../../services/PublicProductService';
import { FilterSidebarComponent } from './filter-sidebar/filter-sidebar.component';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';
import { ToastService } from '../../services/toastService';
import { CategorieService } from '../../services/categorieService';
import { CollaboratorsService } from '../../services/collaborators.service';
import { take, takeUntil } from 'rxjs/operators';
import { forkJoin, Observable, Subject } from 'rxjs';

// Interfaces para tipar categorías y colaboradores
interface Category {
  category_id: number;
  name: string;
}

interface Collaborator {
  collaborator_id: number;
  name: string;
}

// Tipo para las claves de filters
type FilterKey = 'categoryId' | 'minPrice' | 'maxPrice' | 'collaboratorId' | 'search' | 'sort';

@Component({
  selector: 'app-public-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FilterSidebarComponent, SpinnerComponent],
  templateUrl: './public-catalog.component.html',
  styleUrls: ['./public-catalog.component.css']
})
export class PublicCatalogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  products: ProductResponse['products'] = [];
  page = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  filters: {
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
  isLoadingSearch = false;
  activeFilters: { key: FilterKey; value: string; rawValue: any }[] = [];
  categoriesMap: Map<number, string> = new Map();
  collaboratorsMap: Map<number, string> = new Map();

  sortOptions = [
    { label: 'Orden por defecto', value: '' },
    { label: 'Precio: Menor a Mayor', value: 'min_price:ASC' },
    { label: 'Precio: Mayor a Menor', value: 'min_price:DESC' },
    { label: 'Nombre: A-Z', value: 'name:ASC' },
    { label: 'Nombre: Z-A', value: 'name:DESC' }
  ];
  selectedSortOrder: string = '';

  constructor(
    private productService: PublicProductService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private categorieService: CategorieService,
    private collaboratorService: CollaboratorsService
  ) {}

  ngOnInit(): void {
    this.loadCategoriesAndCollaborators().pipe(take(1)).subscribe(() => {
      this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
        this.filters = {
          categoryId: params['categoryId'] ? +params['categoryId'] : null,
          minPrice: params['minPrice'] ? +params['minPrice'] : null,
          maxPrice: params['maxPrice'] ? +params['maxPrice'] : null,
          collaboratorId: params['collaboratorId'] ? +params['collaboratorId'] : null,
          search: params['search'] || null,
          sort: this.selectedSortOrder || null
        };
        this.page = params['page'] ? +params['page'] : 1;
        this.updateActiveFilters();
        this.loadProducts();
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategoriesAndCollaborators(): Observable<void> {
    return new Observable(observer => {
      forkJoin([
        this.categorieService.publicCategories().pipe(take(1)),
        this.collaboratorService.getPublicCollaborators().pipe(take(1))
      ]).subscribe({
        next: (results: [Category[], Collaborator[]]) => {
          const [categories, collaborators] = results;
          this.categoriesMap = new Map(categories.map(cat => [cat.category_id, cat.name]));
          this.collaboratorsMap = new Map(collaborators.map(col => [col.collaborator_id, col.name]));
          observer.next();
          observer.complete();
        },
        error: () => {
          this.categoriesMap = new Map();
          this.collaboratorsMap = new Map();
          observer.next();
          observer.complete();
        }
      });
    });
  }

  loadProducts(): void {
    this.isLoadingSearch = true;
    this.productService.getAllProducts(this.page, this.pageSize, this.filters).subscribe({
      next: (response: ProductResponse) => {
        this.products = response.products;
        this.totalItems = response.total;
        this.page = response.page;
        this.pageSize = response.pageSize;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.isLoadingSearch = false;
        if (this.products.length === 0 && this.page === 1) {
          this.toastService.showToast('No hay productos disponibles para estos filtros.', 'info');
        }
      },
      error: (error) => {
        this.isLoadingSearch = false;
        this.products = [];
        this.totalItems = 0;
        this.totalPages = 0;
        const errorMessage = error?.error?.message || 'Error al cargar los productos';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  onFiltersChange(newFilters: any): void {
    this.filters = { ...this.filters, ...newFilters, search: this.filters.search, sort: this.selectedSortOrder };
    this.page = 1;
    this.updateActiveFilters();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: 1,
        categoryId: this.filters.categoryId ?? null,
        minPrice: this.filters.minPrice ?? null,
        maxPrice: this.filters.maxPrice ?? null,
        collaboratorId: this.filters.collaboratorId ?? null,
        search: this.filters.search ?? null
      },
      queryParamsHandling: 'merge'
    });
  }

  onSortChange(): void {
    this.filters.sort = this.selectedSortOrder;
    this.page = 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 1, sort: this.selectedSortOrder || null },
      queryParamsHandling: 'merge'
    });
  }

  removeFilter(key: FilterKey): void {
    this.filters[key] = null;
    this.page = 1;
    this.updateActiveFilters();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: 1,
        categoryId: this.filters.categoryId ?? null,
        minPrice: this.filters.minPrice ?? null,
        maxPrice: this.filters.maxPrice ?? null,
        collaboratorId: this.filters.collaboratorId ?? null,
        search: this.filters.search ?? null
      },
      queryParamsHandling: 'merge'
    });
  }

  private updateActiveFilters(): void {
    this.activeFilters = [];
    if (this.filters.search !== null) {
      this.activeFilters.push({ key: 'search', value: `Búsqueda: ${this.filters.search}`, rawValue: this.filters.search });
    }
    if (this.filters.categoryId !== null) {
      const categoryName = this.categoriesMap.get(this.filters.categoryId) || `Categoría ${this.filters.categoryId}`;
      this.activeFilters.push({ key: 'categoryId', value: `Categoría: ${categoryName}`, rawValue: this.filters.categoryId });
    }
    if (this.filters.minPrice !== null || this.filters.maxPrice !== null) {
      const minPrice = this.filters.minPrice !== null ? `$${this.filters.minPrice}` : '0';
      const maxPrice = this.filters.maxPrice !== null ? `$${this.filters.maxPrice}` : '∞';
      this.activeFilters.push({ key: 'minPrice', value: `Precio: ${minPrice} - ${maxPrice}`, rawValue: null });
    }
    if (this.filters.collaboratorId !== null) {
      const collaboratorName = this.collaboratorsMap.get(this.filters.collaboratorId) || `Vendedor ${this.filters.collaboratorId}`;
      this.activeFilters.push({ key: 'collaboratorId', value: `Vendedor: ${collaboratorName}`, rawValue: this.filters.collaboratorId });
    }
  }

  goToDetail(productId: number): void {
    this.router.navigate([`/publiccatalog/${productId}`]);
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: newPage },
        queryParamsHandling: 'merge'
      });
    }
  }

  trackByProductId(index: number, product: ProductResponse['products'][0]): number {
    return product.product_id;
  }

  trackByFilter(index: number, filter: { key: FilterKey; value: string }): string {
    return filter.key;
  }
}