import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product, ProductResponse } from '../../services/product.service';
import { CategorieService } from '../../services/categorieService';
import { CollaboratorsService } from '../../services/collaborators.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { ProductCatalogFormComponent } from './product-catalog-form/product-catalog-form.component';
import { ModalComponent } from '../../../modal/modal.component';
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
    ModalComponent
  ],
  templateUrl: './product-catalog.component.html'
})
export class ProductCatalogComponent implements OnInit {
  @ViewChild('productModal') productModal!: ModalComponent;

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
  selectedProductId: number | undefined = undefined;
  modalTitle: string = 'Crear Nuevo Producto';

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

  openProductModal(mode: 'create' | 'edit', product?: Product) {
    if (mode === 'create') {
      this.selectedProductId = undefined;
      this.modalTitle = 'Crear Nuevo Producto';
    } else {
      this.selectedProductId = product?.product_id;
      this.modalTitle = 'Editar Producto';
    }
    this.productModal.open();
  }

  closeProductModal() {
    this.productModal.close();
    this.loadProducts();
    this.selectedProductId = undefined;
  }

  editProduct(product: Product) {
    this.openProductModal('edit', product);
  }

  deleteProduct(product: Product) {
    if (confirm(`¿Estás seguro de que deseas eliminar el producto "${product.name}"?`)) {
      this.productService.deleteProduct(product.product_id).subscribe({
        next: () => {
          this.notification = 'Producto eliminado con éxito';
          this.loadProducts();
          setTimeout(() => this.notification = '', 3000);
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
          this.notification = 'Error al eliminar el producto';
          setTimeout(() => this.notification = '', 3000);
        }
      });
    }
  }

  formatPrice(value: number): string {
    const formatted = value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `$ ${formatted} MXN`;
  }
}