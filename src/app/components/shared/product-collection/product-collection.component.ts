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

// Actualizar el tipo FilterKey
type FilterKey = 'categoryId' | 'minPrice' | 'maxPrice' | 'collaboratorId' | 'onlyOffers' | 'sort' | 'search';

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
    search: string | null;
  } = {
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    collaboratorId: null,
    onlyOffers: false,
    sort: null,
    search: null
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
            sort: params['sort'] || this.selectedSortOrder || null,
            search: params['search'] || null
          };
          
          // Forzar valores nulos si no están en los params
          if (!params['categoryId']) this.filters.categoryId = null;
          if (!params['minPrice']) this.filters.minPrice = null;
          if (!params['maxPrice']) this.filters.maxPrice = null;
          if (!params['collaboratorId']) this.filters.collaboratorId = null;
          if (!params['onlyOffers']) this.filters.onlyOffers = false;
          
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
        requests.push(this.collaboratorService.getPublicCollaborators().pipe(take(

1)));
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
    // Aplicar los nuevos filtros, incluyendo null para los valores limpios
    this.filters = { 
      ...this.filters, 
      ...newFilters,
      sort: this.selectedSortOrder 
    };
    
    // Forzar collaboratorId a null si no es cliente autenticado
    if (!this.isAuthenticated || this.userRole !== 'cliente') {
      this.filters.collaboratorId = null;
    }
    
    this.page = 1;
    this.updateActiveFilters();
    
    // Construir queryParams asegurando que los valores null se reflejen
    const queryParams: any = {
      page: 1,
      categoryId: newFilters.categoryId !== undefined ? newFilters.categoryId : null,
      minPrice: newFilters.minPrice !== undefined ? newFilters.minPrice : null,
      maxPrice: newFilters.maxPrice !== undefined ? newFilters.maxPrice : null,
      collaboratorId: newFilters.collaboratorId !== undefined ? newFilters.collaboratorId : null,
      onlyOffers: newFilters.onlyOffers !== undefined ? newFilters.onlyOffers : false,
      sort: this.filters.sort || null,
      search: this.filters.search || null
    };
    
    // Eliminar parámetros cuando son null/false
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === null || queryParams[key] === false) {
        queryParams[key] = undefined;
      }
    });
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
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
    
    // Construir queryParams
    const queryParams: any = {
      page: 1,
      categoryId: this.filters.categoryId ?? undefined,
      minPrice: this.filters.minPrice ?? undefined,
      maxPrice: this.filters.maxPrice ?? undefined,
      collaboratorId: this.filters.collaboratorId ?? undefined,
      onlyOffers: this.filters.onlyOffers ? true : undefined,
      sort: this.filters.sort ?? undefined,
      search: this.filters.search ?? undefined
    };
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    });
  }

  clearAllFilters(): void {
    // Resetear todos los filtros a sus valores por defecto
    this.filters = {
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      collaboratorId: null,
      onlyOffers: false,
      sort: null,
      search: null
    };

    // Resetear el ordenamiento seleccionado
    this.selectedSortOrder = '';

    // Volver a la primera página
    this.page = 1;

    // Actualizar filtros activos
    this.updateActiveFilters();

    // Navegar y limpiar todos los query params relacionados con filtros
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: 1,
        categoryId: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        collaboratorId: undefined,
        onlyOffers: undefined,
        sort: undefined,
        search: undefined
      },
      queryParamsHandling: 'merge'
    });

    // Mostrar mensaje de confirmación
    this.toastService.showToast('Todos los filtros han sido limpiados', 'success');
  }

  private updateActiveFilters(): void {
    this.activeFilters = [];
    if (this.filters.categoryId !== null) {
      const categoryName = this.categoriesMap.get(this.filters.categoryId) || `Categoría ${this.filters.categoryId}`;
      this.activeFilters.push({ key: 'categoryId', value: `Categoría: ${categoryName}`, rawValue: this.filters.categoryId });
    }
    if (this.filters.minPrice !== null || this.filters.maxPrice !== null) {
      const minPrice = this.filters

.minPrice !== null ? `$${this.filters.minPrice}` : '0';
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
    if (this.filters.search !== null) {
      this.activeFilters.push({ key: 'search', value: `Búsqueda: ${this.filters.search}`, rawValue: this.filters.search });
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

  // Métodos para formatear precio y calificación
  formatPrice(product: Product): string {
    const minPrice = product.min_price || 0;
    const maxPrice = product.max_price || 0;
    return minPrice === maxPrice
      ? `$${minPrice.toFixed(2)}`
      : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
  }

  getFormattedRating(rating: number): string {
    return rating.toFixed(1);
  }

  shouldShowRating(product: Product): boolean {
    return product.average_rating > 0 && product.total_reviews > 0;
  }
}