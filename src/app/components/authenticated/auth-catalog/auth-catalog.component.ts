import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthProductService } from '../../services/authProduct.service';
import { FilterSidebarComponent } from './filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-auth-catalog',
  standalone: true,
  template: `
  <div *ngFor="let product of products">
    <app-product-card [product]="product" (viewDetail)="goToDetail($event)"></app-product-card>
  </div>
  <button (click)="changePage(page - 1)" [disabled]="page === 1">Anterior</button>
  <button (click)="changePage(page + 1)" [disabled]="page * pageSize >= total">Siguiente</button>
  <router-outlet></router-outlet>
`
  ,
  imports: [FilterSidebarComponent, CommonModule],
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
  
  constructor(private productService: AuthProductService, private router: Router) { }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getAllProducts(this.page, this.pageSize, this.filters).subscribe(response => {
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

  goToDetail(productId: number) {
    this.router.navigate([`/publiccatalog/${productId}`]);
  }

  changePage(newPage: number) {
    this.page = newPage;
    this.loadProducts();
  }
}