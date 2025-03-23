import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthProductService } from '../../services/authProduct.service';
import { FilterSidebarComponent } from './filter-sidebar/filter-sidebar.component';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toastService';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';
@Component({
  selector: 'app-auth-catalog',
  standalone: true,
  imports: [SpinnerComponent, FormsModule, FilterSidebarComponent, CommonModule],
  templateUrl: './auth-catalog.component.html',
  styleUrl: './auth-catalog.component.css'
})
export class AuthCatalogComponent implements OnInit {
  products: any[] = [];
  filters: any = {};
  selectedSort: string = '';
  sortOptions: { label: string; value: string }[] = [
    { label: 'Orden por defecto', value: '' },
    { label: 'Nombre (A-Z)', value: 'name:ASC' },
    { label: 'Nombre (Z-A)', value: 'name:DESC' },
    { label: 'Precio: Menor a Mayor', value: 'min_price:ASC' },
    { label: 'Precio: Mayor a Menor', value: 'min_price:DESC' }
  ];

  page = 1;
  pageSize = 20;
  total = 0;
  totalPages = 0;
  isLoading = false;
  constructor(private toastService: ToastService, private productAService: AuthProductService, private router: Router) { }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts(filters?: any) {
    this.isLoading = true;
    const combinedFilters = {
      ...this.filters,
      ...(filters || {}),
      sort: this.selectedSort,
      page: this.page,
      pageSize: this.pageSize
    };

    this.productAService.getAllProducts(combinedFilters).subscribe({
      next: (response) => {
        this.products = response.products;
        this.total = response.total;
        this.page = response.page;
        this.pageSize = response.pageSize;
        this.totalPages = Math.ceil(this.total / this.pageSize);
        this.isLoading = false;
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Error al cargar productos';
        this.toastService.showToast(errorMessage, 'error');
        this.products = [];
        this.total = 0;
        this.totalPages = 0;
        this.isLoading = false;
      }
    });
  }

  onFiltersChange(filters: any) {
    this.filters = filters;
    this.page = 1;
    this.loadProducts();
  }

  onSortChange() {
    this.page = 1;
    this.loadProducts();
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
      this.loadProducts();
    }
  }
  viewProductDetails(productId: number) {
    this.router.navigate(['/authcatalog', productId]);
  }
}