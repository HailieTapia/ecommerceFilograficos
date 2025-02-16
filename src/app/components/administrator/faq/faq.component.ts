import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { FaqService } from '../../services/faq.service';
import { FaqFormComponent } from './faq-form/faq-form.component';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  standalone: true,
  styleUrls: ['./faq.component.css'],
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ]
})
export class FaqComponent implements OnInit {
  displayedColumns: string[] = ['question', 'answer', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>();

  constructor(private faqService: FaqService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.getFaqs();
  }

  getFaqs(): void {
    this.faqService.getAllFaqs().subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.dataSource.data = data;
        } else {
          console.error('Los datos recibidos no son un array válido:', data);
        }
      },
      error: (err) => console.error('Error al obtener preguntas frecuentes:', err)
    });
  }  

  openFormDialog(faq?: any): void {
    const dialogRef = this.dialog.open(FaqFormComponent, {
      width: '500px',
      maxHeight: '90vh',
      autoFocus: false,
      hasBackdrop: true, // <-- Añade esto
      panelClass: 'custom-dialog-container',
      data: faq ? { ...faq } : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getFaqs();
      }
    });
  }

  deleteFaq(faq_id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta pregunta frecuente?')) {
      this.faqService.deleteFaq(faq_id).subscribe({
        next: () => this.getFaqs(),
        error: (err) => console.error('Error al eliminar la pregunta frecuente:', err)
      });
    }
  }
}
