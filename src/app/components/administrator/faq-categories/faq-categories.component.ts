import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations'; 
import { FaqCategoryService } from '../../services/faq-category.service';
import { FaqCategoryFormComponent } from './faq-category-form/faq-category-form.component';

@Component({
  selector: 'app-faq-categories',
  templateUrl: './faq-categories.component.html',
  standalone: true,
  styleUrls: ['./faq-categories.component.css'],
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ]
})
export class FaqCategoriesComponent implements OnInit {
  displayedColumns: string[] = ['name', 'description', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>();

  constructor(private faqCategoryService: FaqCategoryService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.getCategories();
  }

  getCategories(): void {
    this.faqCategoryService.getAllCategories().subscribe({
      next: (data) => {
        if (data && Array.isArray(data.faqCategories)) {
          this.dataSource.data = data.faqCategories;
        } else {
          console.error('Los datos recibidos no son un array válido:', data);
        }
      },
      error: (err) => console.error('Error al obtener categorías:', err)
    });
  }

  openFormDialog(category?: any): void {
    const dialogRef = this.dialog.open(FaqCategoryFormComponent, {
      width: '500px', // Ajusta según necesites
      maxHeight: '90vh', // Evita que el modal se corte
      autoFocus: false, // Evita que el cursor mueva la pantalla
      panelClass: 'custom-dialog-container',
      data: category ? { ...category } : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getCategories();
      }
    });
  }

  deleteCategory(category_id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      this.faqCategoryService.deleteCategory(category_id).subscribe({
        next: () => this.getCategories(),
        error: (err) => console.error('Error al eliminar la categoría:', err)
      });
    }
  }
}
