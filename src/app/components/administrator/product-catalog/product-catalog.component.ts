import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product, ProductResponse } from '../../services/product.service';
import { CategorieService } from '../../services/categorieService';
import { CollaboratorsService } from '../../services/collaborators.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { ProductCatalogFormComponent } from './product-catalog-form/product-catalog-form.component';
import { ModalComponent } from '../../../modal/modal.component'; // Importar ModalComponent
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

interface Category {
  category_id: number;
  name: string;
}

interface Collaborator {
  collaborator_id: number;
  name: string;
}

@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginationComponent,
    ProductCatalogFormComponent,
    ModalComponent // Añadir ModalComponent
  ],
  templateUrl: './product-catalog.component.html'
})
export class ProductCatalogComponent implements OnInit {
  @ViewChild('createProductModal') createProductModal!: ModalComponent; // Referencia al modal

  products: Product[] = [];
  totalProducts = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searchTerm = '';
  selectedCollaboratorId: number | null = null;
  selectedCategoryId: number | null = null;
  selectedProductType: 'Existencia' | 'semi_personalizado' | 'personalizado' | '' = '';
  sortBy: 'name' | 'variant_count' | 'min_price' | 'max_price' | 'total_stock' = 'name';
  sortOrder: 'ASC' | 'DESC' = 'ASC';

  notification: string = '';
  categories: Category[] = [];
  collaborators: Collaborator[] = [];

  constructor(
    private productService: ProductService,
    private categorieService: CategorieService,
    private collaboratorsService: CollaboratorsService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadCollaborators();
    this.loadProducts();
  }

  loadCategories() {
    this.categorieService.getCategories().subscribe({
      next: (response: any) => {
        this.categories = response.map((cat: any) => ({
          category_id: cat.category_id,
          name: cat.name
        }));
      },
      error: (err) => console.error('Error al cargar categorías:', err)
    });
  }

  loadCollaborators() {
    this.collaboratorsService.getAllCollaborators().subscribe({
      next: (response: any[]) => {
        this.collaborators = response.filter(col => col.active).map(col => ({
          collaborator_id: col.collaborator_id,
          name: col.name
        }));
      },
      error: (err) => console.error('Error al cargar colaboradores:', err)
    });
  }

  loadProducts() {
    this.productService.getAllProductsCatalog(
      this.currentPage,
      this.itemsPerPage,
      `${this.sortBy}:${this.sortOrder}`,
      this.searchTerm || undefined,
      this.selectedCollaboratorId || undefined,
      this.selectedCategoryId || undefined,
      this.selectedProductType || undefined
    ).subscribe({
      next: (response: ProductResponse) => {
        this.products = response.products;
        this.totalProducts = response.total;
        this.totalPages = Math.ceil(response.total / this.itemsPerPage);
      },
      error: (err) => console.error('Error loading products:', err)
    });
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.loadProducts();
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.loadProducts();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.debounceSearch().subscribe(() => this.loadProducts());
  }

  debounceSearch() {
    return of(this.searchTerm).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(() => of(null))
    );
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadProducts();
  }

  sort(column: 'name' | 'variant_count' | 'min_price' | 'max_price' | 'total_stock') {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = column;
      this.sortOrder = 'ASC';
    }
    this.loadProducts();
  }

  openCreateProductModal() {
    this.createProductModal.open(); // Abrir el modal
  }

  closeCreateProductModal() {
    this.createProductModal.close(); // Cerrar el modal
    this.loadProducts(); // Recargar productos
  }

  editProduct(product: Product) {
    console.log('Editar producto:', product);
  }

  deleteProduct(product: Product) {
    console.log('Eliminar producto:', product);
  }

  formatPrice(value: number): string {
    const formatted = value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `$ ${formatted} MXN`;
  }
}