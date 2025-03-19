import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PublicProductService, Product } from '../../services/PublicProductService';
@Component({
  selector: 'app-public-catalog',
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
  imports: [CommonModule],
  templateUrl: './public-catalog.component.html',
  styleUrl: './public-catalog.component.css'
})
export class PublicCatalogComponent implements OnInit {
  products: any[] = [];
  page = 1;
  pageSize = 10;
  total = 0;

  constructor(private productService: PublicProductService, private router: Router) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getAllProducts(this.page, this.pageSize).subscribe(response => {
      console.log(response);
      this.products = response.products;
      this.total = response.total;
      this.page = response.page;
      this.pageSize = response.pageSize;
    });
  }

  goToDetail(productId: number) {
    this.router.navigate([`/catalog/${productId}`]);
  }

  changePage(newPage: number) {
    this.page = newPage;
    this.loadProducts();
  }
}