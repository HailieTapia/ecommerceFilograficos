import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FaqService } from '../../services/faq.service';
import { FaqFormComponent } from './faq-form/faq-form.component';

export interface FaqCategory {
  id: string;  // Cambiado de 'id' a 'category_id'
  name: string;
  description: string;
  faqs: Faq[];
}

export interface Faq {
  id: string;  // Cambiado de 'id' a 'faq_id'
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  standalone: true,
  styleUrls: ['./faq.component.css'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ]
})
export class FaqComponentAdmin implements OnInit {
  categories: FaqCategory[] = [];

  constructor(private faqService: FaqService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.getFaqs();
  }

  getFaqs(): void {
    this.faqService.getAllFaqs().subscribe({
      next: (data) => {
        if (data && Array.isArray(data)) {
          this.categories = data;
        } else {
          console.error('Los datos recibidos no son un array válido:', data);
        }
      },
      error: (err) => console.error('Error al obtener preguntas frecuentes:', err)
    });
  }

  openFormDialog(faq?: Faq, category?: FaqCategory): void {
    const dialogRef = this.dialog.open(FaqFormComponent, {
      width: '500px',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      autoFocus: false,
      data: {
        faq: faq ? { ...faq } : null,
        category: category ? { ...category } : null
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getFaqs();
      }
    });
  }

  deleteFaq(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta pregunta frecuente?')) {
      this.faqService.deleteFaq(id).subscribe({
        next: () => this.getFaqs(),
        error: (err) => console.error('Error al eliminar la pregunta frecuente:', err)
      });
    }
  }
}