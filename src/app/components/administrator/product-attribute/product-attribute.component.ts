import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductAttributeService } from '../../services/product-attribute.service';
import { AttributeCountCardsComponent } from './attribute-count-cards/attribute-count-cards.component';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'app-product-attribute',
  standalone: true,
  imports: [CommonModule, FormsModule, AttributeCountCardsComponent, PaginationComponent],
  templateUrl: './product-attribute.component.html',
  styleUrls: ['./product-attribute.component.css']
})
export class ProductAttributeComponent implements OnInit {
  categoryCounts: { categoryId: string; name: string; attributeCount: number }[] = [];
  selectedCategory: { categoryId: string; name: string; attributeCount: number } | null = null;
  attributes: { attribute_id: string; attribute_name: string; data_type: string; allowed_values: string }[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  constructor(private productAttributeService: ProductAttributeService) {}

  ngOnInit(): void {
    this.loadAttributeCounts();
  }

  loadAttributeCounts(): void {
    this.productAttributeService.getAttributeCountByCategory().subscribe({
      next: (response) => {
        console.log('Respuesta de getAttributeCountByCategory:', response); // Para depurar
        const data = Array.isArray(response) ? response : [];
        this.categoryCounts = data.map((item: any) => ({
          categoryId: item?.category_id?.toString() ?? 'N/A',
          name: item?.category_name ?? 'Categoría Desconocida',
          attributeCount: item?.attribute_count ?? 0
        }));
        // Seleccionar la primera categoría válida por defecto
        const firstValidCategory = this.categoryCounts.find(category => category.categoryId !== 'N/A');
        if (firstValidCategory) {
          this.selectCategory(firstValidCategory);
        } else {
          console.warn('No se encontraron categorías válidas para seleccionar por defecto');
        }
      },
      error: (err) => console.error('Error al cargar conteos de atributos:', err)
    });
  }

  selectCategory(category: { categoryId: string; name: string; attributeCount: number }): void {
    this.selectedCategory = category;
    this.currentPage = 1; // Reiniciar a la primera página al cambiar de categoría
    this.loadAttributesByCategory();
  }

  loadAttributesByCategory(): void {
    if (!this.selectedCategory || this.selectedCategory.categoryId === 'N/A') {
      this.attributes = []; // Limpiar atributos si no hay categoría válida
      this.totalItems = 0;
      return;
    }

    this.productAttributeService.getAttributesByCategory(this.selectedCategory.categoryId, this.currentPage, this.itemsPerPage).subscribe({
      next: (response) => {
        this.attributes = response.data.map((attr: any) => ({
          attribute_id: attr.attribute_id.toString(),
          attribute_name: attr.attribute_name,
          data_type: attr.data_type,
          allowed_values: attr.allowed_values
        }));
        this.totalItems = response.total || 0;
      },
      error: (err) => {
        console.error('Error al cargar atributos de la categoría:', err);
        this.attributes = []; // Limpiar atributos en caso de error
        this.totalItems = 0;
      }
    });
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadAttributesByCategory();
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1; // Resetear a la primera página
    this.loadAttributesByCategory();
  }
}