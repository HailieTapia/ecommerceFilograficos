import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { FaqCategoryService } from '../../services/faq-category.service';
import { FaqCategoryFormComponent } from './faq-category-form/faq-category-form.component';

@Component({
  selector: 'app-faq-categories',
  templateUrl: './faq-categories.component.html',
  standalone: true,
  styleUrls: ['./faq-categories.component.scss'],
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule]  // 🔹 Agrega estos módulos
})
export class FaqCategoriesComponent implements OnInit {
  categories: any[] = [];

  constructor(private faqCategoryService: FaqCategoryService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.getCategories();
  }

  getCategories(): void {
    this.faqCategoryService.getAllCategories().subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error('Error al obtener categorías:', err)
    });
  }

  openFormDialog(category?: any): void {
    const dialogRef = this.dialog.open(FaqCategoryFormComponent, {
      width: '400px',
      data: category ? { ...category } : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getCategories();
      }
    });
  }

  deleteCategory(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      this.faqCategoryService.deleteCategory(id).subscribe({
        next: () => this.getCategories(),
        error: (err) => console.error('Error al eliminar la categoría:', err)
      });
    }
  }
}
