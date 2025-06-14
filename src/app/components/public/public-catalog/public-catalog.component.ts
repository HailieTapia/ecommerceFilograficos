import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicProductService, ProductResponse } from '../../services/PublicProductService';
import { FilterSidebarComponent } from './filter-sidebar/filter-sidebar.component';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';
import { ToastService } from '../../services/toastService';
import { CategorieService } from '../../services/categorieService';
import { CollaboratorsService } from '../../services/collaborators.service';
import { take } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';

// Interfaces para tipar categorías y colaboradores
interface Category {
  category_id: number;
  name: string;
}

interface Collaborator {
  collaborator_id: number;
  name: string;
}

@Component({
  selector: 'app-public-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FilterSidebarComponent, SpinnerComponent],
  templateUrl: './public-catalog.component.html',
  styleUrl: './public-catalog.component.css'
})
export class PublicCatalogComponent implements OnInit {
  products: ProductResponse['products'] = [];
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;
  filters: any = {
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    collaboratorId: null,
    sort: null
  };
  isLoading = false;
  activeFilters: { key: string, value: string, rawValue: any }[] = [];
  categoriesMap: Map<number, string> = new Map();
  collaboratorsMap: Map<number, string> = new Map();

  sortOptions = [
    { label: 'Orden por defecto', value: '' },
    { label: 'Precio: Menor a Mayor', value: 'min_price:ASC' },
    { label: 'Precio: Mayor a Menor', value: 'min_price:DESC' },
    { label: 'Nombre: A-Z', value: 'name:ASC' },
    { label: 'Nombre: Z-A', value: 'name:DESC' }
  ];
  selectedSort: string = '';

  constructor(
    private productService: PublicProductService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private categorieService: CategorieService,
    private collaboratorService: CollaboratorsService
  ) {}

  ngOnInit(): void {
    // Cargar categorías y colaboradores para mapear nombres
    this.loadCategoriesAndCollaborators().subscribe(() => {
      // Leer query params
      this.route.queryParams.pipe(take(1)).subscribe(params => {
        if (params['categoryId']) {
          this.filters.categoryId = +params['categoryId'];
        }
        if (params['minPrice']) {
          this.filters.minPrice = +params['minPrice'];
        }
        if (params['maxPrice']) {
          this.filters.maxPrice = +params['maxPrice'];
        }
        if (params['collaboratorId']) {
          this.filters.collaboratorId = +params['collaboratorId'];
        }
        this.updateActiveFilters();
        this.loadProducts();
      });
    });
  }

  private loadCategoriesAndCollaborators(): Observable<void> {
    return new Observable(observer => {
      forkJoin([
        this.categorieService.publicCategories().pipe(take(1)),
        this.collaboratorService.getPublicCollaborators().pipe(take(1))
      ]).subscribe({
        next: ([categories, collaborators]: [Category[], Collaborator[]]) => {
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
    this.isLoading = true;
    this.productService.getAllProducts(this.page, this.pageSize, this.filters).subscribe({
      next: (response: ProductResponse) => {
        this.products = response.products;
        this.total = response.total;
        this.page = response.page;
        this.pageSize = response.pageSize;
        this.totalPages = Math.ceil(this.total / this.pageSize);
        this.isLoading = false;
        if (this.products.length === 0 && this.page === 1) {
          this.toastService.showToast('No hay productos disponibles para estos filtros.', 'info');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.products = [];
        this.total = 0;
        this.totalPages = 0;
        const errorMessage = error?.error?.message || 'Error al cargar los productos';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  onFiltersChange(newFilters: any): void {
    this.filters = { ...this.filters, ...newFilters, sort: this.selectedSort };
    this.page = 1;
    this.updateActiveFilters();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        categoryId: this.filters.categoryId ?? null,
        minPrice: this.filters.minPrice ?? null,
        maxPrice: this.filters.maxPrice ?? null,
        collaboratorId: this.filters.collaboratorId ?? null
      },
      queryParamsHandling: 'merge'
    });
    this.loadProducts();
  }

  onSortChange(): void {
    this.filters.sort = this.selectedSort;
    this.page = 1;
    this.loadProducts();
  }

  removeFilter(key: string): void {
    this.filters[key] = null;
    this.page = 1;
    this.updateActiveFilters();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        categoryId: this.filters.categoryId ?? null,
        minPrice: this.filters.minPrice ?? null,
        maxPrice: this.filters.maxPrice ?? null,
        collaboratorId: this.filters.collaboratorId ?? null
      },
      queryParamsHandling: 'merge'
    });
    this.loadProducts();
  }

  private updateActiveFilters(): void {
    this.activeFilters = [];
    if (this.filters.categoryId !== null) {
      const categoryName = this.categoriesMap.get(this.filters.categoryId) || `Categoría ${this.filters.categoryId}`;
      this.activeFilters.push({ key: 'categoryId', value: `Categoría: ${categoryName}`, rawValue: this.filters.categoryId });
    }
    if (this.filters.minPrice !== null || this.filters.maxPrice !== null) {
      const min = this.filters.minPrice !== null ? `$${this.filters.minPrice}` : '0';
      const max = this.filters.maxPrice !== null ? `$${this.filters.maxPrice}` : '∞';
      this.activeFilters.push({ key: 'minPrice', value: `Precio: ${min} - ${max}`, rawValue: null });
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
      this.loadProducts();
    }
  }

  trackByProductId(index: number, product: ProductResponse['products'][0]): number {
    return product.product_id;
  }

  trackByFilter(index: number, filter: { key: string, value: string }): string {
    return filter.key;
  }
}