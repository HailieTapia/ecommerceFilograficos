import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CategorieService } from '../../../services/categorieService';
import { ToastService } from '../../../services/toastService';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';

@Component({
  selector: 'app-product-categories',
  standalone: true,
  imports: [CommonModule, RouterModule, SpinnerComponent],
  templateUrl: './product-categories.component.html',
  styleUrls: ['./product-categories.component.css']
})
export class ProductCategoriesComponent implements OnInit {
  categories: { category_id: number, name: string, imagen_url?: string | null, color_fondo?: string | null }[] = [];
  isLoading: boolean = false;
  isLoaded: boolean = false;

  constructor(
    private categorieService: CategorieService,
    private toastService: ToastService,
    private router: Router
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
    this.router.navigate(['/collection'], { queryParams: { categoryId } });
  }

  trackByCategoryId(index: number, category: { category_id: number }): number {
    return category.category_id;
  }

  getSizeClasses(index: number): string {
    const totalCategories = this.categories.length;
    const layouts = [
      'tall-left', // 2 rows, 1 column
      'square-mid-top', // 1 row, 1 column
      'square-right-top', // 1 row, 1 column
      'wide-triple', // 1 row, 3 columns
      'square-mid-bottom', // 1 row, 1 column
      'square-right-bottom', // 1 row, 1 column
      'wide-double', // 1 row, 2 columns
      'small-right', // 1 row, 1 column
      'large-feature', // 2 rows, 2 columns
      'tall-right', // 2 rows, 1 column
      'square-mid-1', // 1 row, 1 column
      'square-mid-2', // 1 row, 1 column
      'triple-1', // 1 row, 1 column
      'triple-2', // 1 row, 1 column
      'triple-3', // 1 row, 1 column
      'wide-final' // 1 row, 3 columns
    ];

    // Dynamically assign layout based on index and total categories
    const layout = layouts[index % layouts.length] || 'col-span-1 row-span-1 h-32';

    switch (layout) {
      case 'tall-left':
        return 'col-span-1 row-span-2 h-80';
      case 'square-mid-top':
      case 'square-mid-bottom':
      case 'square-right-top':
      case 'square-right-bottom':
      case 'square-mid-1':
      case 'square-mid-2':
        return 'col-span-1 row-span-1 h-36';
      case 'wide-triple':
      case 'wide-final':
        return totalCategories >= 3 ? 'col-span-3 row-span-1 h-32' : 'col-span-2 row-span-1 h-32';
      case 'wide-double':
        return 'col-span-2 row-span-1 h-40';
      case 'small-right':
        return 'col-span-1 row-span-1 h-40';
      case 'large-feature':
        return totalCategories >= 4 ? 'col-span-2 row-span-2 h-80' : 'col-span-1 row-span-1 h-40';
      case 'tall-right':
        return 'col-span-1 row-span-2 h-80';
      case 'triple-1':
      case 'triple-2':
      case 'triple-3':
        return 'col-span-1 row-span-1 h-44';
      default:
        return 'col-span-1 row-span-1 h-32';
    }
  }

  getGradientClasses(index: number): string {
    const colors = [
      'from-blue-500 to-blue-700',
      'from-pink-500 to-pink-700',
      'from-green-500 to-green-700',
      'from-orange-500 to-orange-700',
      'from-purple-500 to-purple-700',
      'from-yellow-500 to-yellow-600',
      'from-rose-500 to-rose-700',
      'from-gray-600 to-gray-800',
      'from-emerald-500 to-emerald-700',
      'from-amber-500 to-amber-700',
      'from-indigo-500 to-indigo-700',
      'from-red-500 to-red-700',
      'from-slate-500 to-slate-700',
      'from-cyan-500 to-cyan-700',
      'from-teal-500 to-teal-700',
      'from-violet-500 to-violet-700'
    ];
    return colors[index % colors.length] || 'from-gray-500 to-gray-700';
  }
}