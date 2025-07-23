import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCollectionService, ProductResponse, Product } from '../../services/product-collection.service';
import { AuthService } from '../../services/auth.service';
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
  id: number;
  name: string;
}

// Tipo para las claves de filtros
type FilterKey = 'categoryId' | 'minPrice' | 'maxPrice' | 'collaboratorId' | 'onlyOffers' | 'sort';

@Component({
  selector: 'app-product-collection',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FilterSidebarComponent, SpinnerComponent],
  templateUrl: './product-collection.component.html',
  styleUrls: ['./product-collection.component.css']
})
export class ProductCollectionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  products: Product[] = [];
  page = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;
  filters: {
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
  isLoadingSearch = false;
  activeFilters: { key: FilterKey; value: string; rawValue: any }[] = [];
  categoriesMap: Map<number, string> = new Map();
  collaboratorsMap: Map<number, string> = new Map();
  isAuthenticated = false;
  userRole: string | null = null;

  sortOptions = [
    { label: 'Orden por defecto', value: '' },
    { label: 'Precio: Menor a Mayor', value: 'min_price:ASC' },
    { label: 'Precio: Mayor a Menor', value: 'min_price:DESC' },
    { label: 'Nombre: A-Z', value: 'name:ASC' },
    { label: 'Nombre: Z-A', value: 'name:DESC' }
  ];
  selectedSortOrder: string = '';

  constructor(
    private productService: ProductCollectionService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private categorieService: CategorieService,
    private collaboratorService: CollaboratorsService
  ) {}

  ngOnInit(): void {
    this.authService.getUser().pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.isAuthenticated = !!user;
      this.userRole = user ? user.tipo : null;

      if (this.userRole === 'administrador') {
        this.router.navigate(['/product-catalog']);
        return;
      }

      this.loadCategoriesAndCollaborators().pipe(take(1)).subscribe(() => {
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
          this.filters = {
            categoryId: params['categoryId'] ? +params['categoryId'] : null,
            minPrice: params['minPrice'] ? +params['minPrice'] : null,
            maxPrice: params['maxPrice'] ? +params['maxPrice'] : null,
            collaboratorId: params['collaboratorId'] && this.isAuthenticated && this.userRole === 'cliente' ? +params['collaboratorId'] : null,
            onlyOffers: params['onlyOffers'] === 'true',
            sort: params['sort'] || this.selectedSortOrder || null
          };
          this.page = params['page'] ? +params['page'] : 1;
          this.selectedSortOrder = this.filters.sort || '';
          this.updateActiveFilters();
          this.loadProducts();
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategoriesAndCollaborators(): Observable<void> {
    return new Observable(observer => {
      const requests: Observable<any>[] = [
        this.categorieService.publicCategories().pipe(take(1))
      ];
      if (this.isAuthenticated && this.userRole === 'cliente') {
        requests.push(this.collaboratorService.getAuthCollaborators().pipe(take(1)));
      } else {
        requests.push(this.collaboratorService.getPublicCollaborators().pipe(take(1)));
      }

      forkJoin(requests).subscribe({
        next: (responses: any[]) => {
          const categories = responses[0] as Category[];
          const collaborators = responses[1] as Collaborator[];
          
          // Validar y mapear categorías
          this.categoriesMap = new Map(
            Array.isArray(categories) 
              ? categories
                  .filter(cat => cat && typeof cat === 'object' && 'category_id' in cat && 'name' in cat)
                  .map(cat => [cat.category_id, cat.name])
              : []
          );

          // Validar y mapear colaboradores
          this.collaboratorsMap = new Map(
            Array.isArray(collaborators) 
              ? collaborators
                  .filter(col => col && typeof col === 'object' && 'id' in col && 'name' in col)
                  .map(col => [col.id, col.name])
              : []
          );

          observer.next();
          observer.complete();
        },
        error: (error) => {
          console.error('Error al cargar categorías o colaboradores:', error);
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
    const combinedFilters = {
      ...this.filters,
      page: this.page,
      pageSize: this.pageSize
    };
    this.productService.getAllProducts(combinedFilters, this.isAuthenticated).subscribe({
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
        this.toastService.showToast(error.message, 'error');
      }
    });
  }

  onFiltersChange(newFilters: any): void {
    this.filters = { ...this.filters, ...newFilters, sort: this.selectedSortOrder };
    if (!this.isAuthenticated || this.userRole !== 'cliente') {
      this.filters.collaboratorId = null;
    }
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
        onlyOffers: this.filters.onlyOffers ?? null,
        sort: this.filters.sort ?? null
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
    if (key === 'minPrice' || key === 'maxPrice') {
      this.filters.minPrice = null;
      this.filters.maxPrice = null;
    } else if (key === 'onlyOffers') {
      this.filters.onlyOffers = false;
    } else {
      this.filters[key] = null;
    }
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
        onlyOffers: this.filters.onlyOffers ?? null,
        sort: this.filters.sort ?? null
      },
      queryParamsHandling: 'merge'
    });
  }

  private updateActiveFilters(): void {
    this.activeFilters = [];
    if (this.filters.categoryId !== null) {
      const categoryName = this.categoriesMap.get(this.filters.categoryId) || `Categoría ${this.filters.categoryId}`;
      this.activeFilters.push({ key: 'categoryId', value: `Categoría: ${categoryName}`, rawValue: this.filters.categoryId });
    }
    if (this.filters.minPrice !== null || this.filters.maxPrice !== null) {
      const minPrice = this.filters.minPrice !== null ? `$${this.filters.minPrice}` : '0';
      const maxPrice = this.filters.maxPrice !== null ? `$${this.filters.maxPrice}` : '∞';
      this.activeFilters.push({ key: 'minPrice', value: `Precio: ${minPrice} - ${maxPrice}`, rawValue: null });
    }
    if (this.filters.collaboratorId !== null && this.isAuthenticated && this.userRole === 'cliente') {
      const collaboratorName = this.collaboratorsMap.get(this.filters.collaboratorId) || `Vendedor ${this.filters.collaboratorId}`;
      this.activeFilters.push({ key: 'collaboratorId', value: `Vendedor: ${collaboratorName}`, rawValue: this.filters.collaboratorId });
    }
    if (this.filters.onlyOffers) {
      this.activeFilters.push({ key: 'onlyOffers', value: 'Solo Ofertas', rawValue: this.filters.onlyOffers });
    }
  }

  goToDetail(productId: number): void {
    this.router.navigate([`/collection/${productId}`]);
  }

  goToCart(): void {
    if (this.isAuthenticated && this.userRole === 'cliente') {
      this.router.navigate(['/cart']);
    } else {
      this.toastService.showToast('Necesitas iniciar sesión para acceder al carrito', 'warning');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
    }
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

  getPageNumbers(): number[] {
    const pageNumbers: number[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, this.page - halfVisible);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  }

  getDisplayRangeEnd(): number {
    return Math.min(this.page * this.pageSize, this.totalItems);
  }

  trackByProductId(index: number, product: Product): number {
    return product.product_id;
  }

  trackByFilter(index: number, filter: { key: FilterKey; value: string }): string {
    return filter.key;
  }
}