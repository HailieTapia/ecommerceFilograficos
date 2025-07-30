import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { CategorieService } from '../../../services/categorieService';
import { ToastService } from '../../../services/toastService';
import { SpinnerComponent } from '../../reusable/spinner/spinner.component';

@Component({
  selector: 'app-carousel-categories',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  templateUrl: './carousel-categories.component.html',
  styleUrls: ['./carousel-categories.component.css']
})
export class CarouselCategoriesComponent implements OnInit, OnDestroy {
  categories: { category_id: number, name: string, imagen_url?: string, color_fondo?: string }[] = [];
  isLoadingCategories = false;
  isCategoriesLoaded = false;
  currentCategoryIndex = 0;
  isAutoPlaying = true;
  itemsPerView = 5;

  private breakpointSubscription: Subscription | null = null;
  private autoPlayInterval: any = null;

  constructor(
    private categorieService: CategorieService,
    private toastService: ToastService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    this.observeBreakpoints();
    this.loadCategories();
    this.startAutoPlay();
  }

  private observeBreakpoints() {
    this.breakpointSubscription = this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge
    ]).subscribe(result => {
      if (result.breakpoints[Breakpoints.XSmall]) this.itemsPerView = 2;
      else if (result.breakpoints[Breakpoints.Small]) this.itemsPerView = 2;
      else if (result.breakpoints[Breakpoints.Medium]) this.itemsPerView = 3;
      else this.itemsPerView = 5;
    });
  }

  private loadCategories(): void {
    this.isLoadingCategories = true;
    this.categorieService.publicCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoadingCategories = false;
        this.isCategoriesLoaded = true;
        if (categories.length === 0) {
          this.toastService.showToast('No hay categorías disponibles.', 'info');
        }
      },
      error: (err) => {
        this.isLoadingCategories = false;
        this.isCategoriesLoaded = true;
        const errorMessage = err?.error?.message || 'Error al cargar las categorías';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  private startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      if (this.isAutoPlaying) {
        this.nextCategory();
      }
    }, 3000);
  }

  private stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  ngOnDestroy() {
    this.breakpointSubscription?.unsubscribe();
    this.stopAutoPlay();
  }

  nextCategory() {
    const maxIndex = this.maxCategoryIndex;
    this.currentCategoryIndex = (this.currentCategoryIndex >= maxIndex) ? 0 : this.currentCategoryIndex + 1;
  }

  prevCategory() {
    this.currentCategoryIndex = Math.max(this.currentCategoryIndex - 1, 0);
  }

  goToCategory(index: number) {
    this.currentCategoryIndex = Math.min(Math.max(index, 0), this.maxCategoryIndex);
  }

  toggleAutoPlay(state: boolean) {
    this.isAutoPlaying = state;
  }

  navigateToProducts(categoryId: number): void {
    this.router.navigate(['/collection'], { queryParams: { categoryId } });
  }

  trackByCategoryId(index: number, category: { category_id: number }): number {
    return category.category_id;
  }

  get maxCategoryIndex(): number {
    return Math.max(0, Math.ceil(this.categories.length - this.itemsPerView));
  }

  get visibleCategories(): { category_id: number, name: string, imagen_url?: string, color_fondo?: string }[] {
    const start = this.currentCategoryIndex;
    const end = Math.min(start + this.itemsPerView, this.categories.length);
    return this.categories.slice(start, end);
  }
}