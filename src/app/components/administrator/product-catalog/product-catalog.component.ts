import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product, ProductResponse } from '../../../services/product.service';
import { CategorieService } from '../../../services/categorieService';
import { CollaboratorsService } from '../../../services/collaborators.service';
import { ToastService } from '../../../services/toastService';
import { PaginationComponent } from '../pagination/pagination.component';
import { ProductCatalogFormComponent } from './product-catalog-form/product-catalog-form.component';
import { ModalComponent } from '../../reusable/modal/modal.component';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';

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
export class ProductCatalogComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('productModal') productModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

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

  categories: Category[] = [];
  collaborators: Collaborator[] = [];
  selectedProductId: number | undefined = undefined;
  confirmAction: (() => void) | null = null;
  confirmModalTitle: string = '';
  confirmModalMessage: string = '';
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';
  private subscriptions: Subscription = new Subscription();

  constructor(
    private productService: ProductService,
    private categorieService: CategorieService,
    private collaboratorsService: CollaboratorsService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadCollaborators();
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    if (!this.productModal || !this.confirmModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadCategories() {
    this.subscriptions.add(
      this.categorieService.getCategories().subscribe({
        next: (response: any) => {
          this.categories = response.map((cat: any) => ({
            category_id: cat.category_id,
            name: cat.name
          }));
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar categorías';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  loadCollaborators() {
    this.subscriptions.add(
      this.collaboratorsService.getAllCollaborators().subscribe({
        next: (response: any[]) => {
          this.collaborators = response.filter(col => col.active).map(col => ({
            collaborator_id: col.collaborator_id,
            name: col.name
          }));
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar colaboradores';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
  }

  loadProducts() {
    this.subscriptions.add(
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
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar productos';
          this.toastService.showToast(errorMessage, 'error');
        }
      })
    );
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
    this.subscriptions.add(
      this.debounceSearch().subscribe(() => this.loadProducts())
    );
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
    if (!this.productModal) {
      this.toastService.showToast('Error: Modal de producto no inicializado', 'error');
      return;
    }
    if (mode === 'create') {
      this.selectedProductId = undefined;
      this.productModal.title = 'Crear Nuevo Producto';
      this.productModal.modalType = 'success';
    } else {
      this.selectedProductId = product?.product_id;
      this.productModal.title = 'Editar Producto';
      this.productModal.modalType = 'info';
    }
    this.productModal.open();
  }

  closeProductModal() {
    if (this.productModal) {
      this.productModal.close();
    }
    this.loadProducts();
    this.selectedProductId = undefined;
  }

  editProduct(product: Product) {
    this.openProductModal('edit', product);
  }

  openConfirmModal(title: string, message: string, modalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default', action: () => void) {
    if (!this.confirmModal) {
      this.toastService.showToast('Error: Modal de confirmación no inicializado', 'error');
      return;
    }
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmModalType = modalType;
    this.confirmAction = action;
    this.confirmModal.title = title;
    this.confirmModal.modalType = modalType;
    this.confirmModal.isConfirmModal = true;
    this.confirmModal.confirmText = 'Confirmar';
    this.confirmModal.cancelText = 'Cancelar';
    this.confirmModal.open();
  }

  handleConfirm(): void {
    if (this.confirmAction) {
      this.confirmAction();
      this.confirmAction = null;
    }
  }

  deleteProduct(product: Product) {
    this.openConfirmModal(
      'Eliminar Producto',
      `¿Estás seguro de que deseas eliminar el producto "${product.name}"?`,
      'danger',
      () => {
        this.subscriptions.add(
          this.productService.deleteProduct(product.product_id).subscribe({
            next: () => {
              this.toastService.showToast('Producto eliminado con éxito', 'success');
              this.loadProducts();
              if (this.confirmModal) this.confirmModal.close();
            },
            error: (err) => {
              const errorMessage = err?.error?.message || 'Error al eliminar el producto';
              this.toastService.showToast(errorMessage, 'error');
              if (this.confirmModal) this.confirmModal.close();
            }
          })
        );
      }
    );
  }

  handleProductSaved(message: string) {
    this.toastService.showToast(message, 'success');
    this.closeProductModal();
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }
}