import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product, ProductResponse } from '../../services/product.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { ProductCatalogFormComponent } from './product-catalog-form/product-catalog-form.component';

@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginationComponent,
    ProductCatalogFormComponent // Importamos el formulario
  ],
  templateUrl: './product-catalog.component.html',
  styleUrls: ['./product-catalog.component.css']
})
export class ProductCatalogComponent implements OnInit {
  @ViewChild(ProductCatalogFormComponent) productFormModal!: ProductCatalogFormComponent;

  products: Product[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  sortColumn: string | null = 'product_id'; // Por defecto ordenar por ID del producto
  sortDirection: 'ASC' | 'DESC' = 'ASC';

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  public loadProducts(): void {
    const sortParam = this.sortColumn ? `${this.sortColumn}:${this.sortDirection}` : undefined;
    this.productService.getAllProductsCatalog(this.currentPage, this.itemsPerPage, sortParam).subscribe({
      next: (response: ProductResponse) => {
        console.log('Productos recibidos del backend:', response.products); // Depuración
        this.products = response.products;
        this.totalItems = response.total;
      },
      error: (e) => {
        console.error('Error al cargar productos:', e);
      }
    });
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadProducts();
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  openCreateModal(): void {
    if (this.productFormModal) {
      this.productFormModal.productId = null; // Para creación
      this.productFormModal.openModal();
    } else {
      console.error('El componente del formulario no está inicializado.');
    }
  }

  onProductSaved(): void {
    this.loadProducts(); // Recargar productos después de guardar
  }

  toggleSort(column: string): void {
    const validColumns = ['name', 'product_id', 'variant_count', 'min_price', 'max_price', 'total_stock'];
    if (!validColumns.includes(column)) return;

    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'ASC';
    }
    this.currentPage = 1;
    this.loadProducts();
  }

  deleteProduct(product: Product): void {
    if (!product.product_id) {
      console.error('El product_id no está definido para el producto:', product);
      alert('No se puede eliminar el producto porque falta su ID.');
      return;
    }

    const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar el producto "${product.name}"? Esto eliminará todas sus variantes.`);
    if (confirmDelete) {
      console.log('Eliminando producto con ID:', product.product_id); // Depuración
      this.productService.deleteProduct(product.product_id).subscribe({
        next: (response) => {
          alert(response.message);
          this.loadProducts();
        },
        error: (err) => {
          console.error('Error al eliminar el producto:', err);
          alert('Error al eliminar el producto');
        }
      });
    }
  }

  editProduct(productId: number): void {
    if (!productId) {
      console.error('El productId no está definido para editar');
      alert('No se puede editar el producto porque falta su ID.');
      return;
    }
    if (this.productFormModal) {
      this.productFormModal.productId = productId; // Para edición
      this.productFormModal.openModal();
    } else {
      console.error('El componente del formulario no está inicializado.');
    }
  }
}