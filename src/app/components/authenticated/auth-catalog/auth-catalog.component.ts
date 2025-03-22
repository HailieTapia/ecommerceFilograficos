import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthProductService } from '../../services/authProduct.service';
import { FilterSidebarComponent } from './filter-sidebar/filter-sidebar.component';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-auth-catalog',
  standalone: true,
  template: `
  <div *ngFor="let product of products">
    <app-product-card [product]="product" (viewDetail)="goToDetail($event)"></app-product-card>
  </div>
  <button (click)="changePage(page - 1)" [disabled]="page === 1">Anterior</button>
  <button (click)="changePage(page + 1)" [disabled]="page * pageSize >= total">Siguiente</button>
  <router-outlet></router-outlet>`,
  imports: [FormsModule, FilterSidebarComponent, CommonModule],
  templateUrl: './auth-catalog.component.html',
  styleUrl: './auth-catalog.component.css'
})
export class AuthCatalogComponent implements OnInit {
  products: any[] = [];
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;
  filters: any = {};

  sortOptions = [
    { label: 'Orden por defecto', value: '' },
    { label: 'Precio: Menor a Mayor', value: 'min_price:ASC' },
    { label: 'Precio: Mayor a Menor', value: 'min_price:DESC' },
    { label: 'Nombre: A-Z', value: 'name:ASC' },
    { label: 'Nombre: Z-A', value: 'name:DESC' }
  ];
  selectedSort: string = '';

  constructor(private productAService: AuthProductService, private router: Router) { }

  ngOnInit() {
    this.loadProducts();
  }
  loadProducts() {
    this.productAService.getAllProducts(this.page, this.pageSize, this.filters).subscribe(response => {
      this.products = response.products;
      this.total = response.total;
      this.page = response.page;
      this.pageSize = response.pageSize;
      this.totalPages = Math.ceil(this.total / this.pageSize);
    });
  }
  onFiltersChange(newFilters: any) {
    this.filters = newFilters;
    this.page = 1;
    this.loadProducts();
  }
  onSortChange() {
    this.filters.sort = this.selectedSort;
    this.page = 1;
    this.loadProducts();
  }
  goToDetail(productId: number) {
    this.router.navigate([`/authcatalog/${productId}`]);
  }
  changePage(newPage: number) {
    this.page = newPage;
    this.loadProducts();
  }
}