import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategorieService } from '../../services/categorieService';
import { ToastService } from '../../services/toastService';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';

@Component({
  selector: 'app-product-categories',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  templateUrl: './product-categories.component.html',
  styleUrl: './product-categories.component.css'
})
export class ProductCategoriesComponent implements OnInit {
  categories: { category_id: number, name: string, imagen_url?: string, color_fondo?: string }[] = [];
  isLoading: boolean = false;
  isLoaded: boolean = false;

  constructor(
    private categorieService: CategorieService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.isLoading = true;
    this.categorieService.publicCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoading = false;
        this.isLoaded = true;
        if (categories.length === 0) {
          this.toastService.showToast('No hay categorías disponibles.', 'info');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.isLoaded = true;
        const errorMessage = err?.error?.message || 'Error al cargar las categorías';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  navigateToProducts(categoryId: number): void {
    // Método preparado para redirigir al catálogo de productos con filtro por categoría
    // No funcional por ahora, según instrucciones
    console.log(`Navegando a productos de la categoría ${categoryId}`);
  }

  trackByCategoryId(index: number, category: { category_id: number }): number {
    return category.category_id;
  }
}