import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FaqService } from '../../../services/faq.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FaqCategoryService } from '../../../services/faq-category.service';

interface FaqCategory {
  category_id: number; // Cambiado a number para coincidir con el backend
  name: string;
  description: string;
  status: string;
}

interface Faq {
  id: number;  // Cambiado de 'id' a 'faq_id'
  question: string;
  category_id: number;
  answer: string;
  createdAt: string;
  updatedAt: string;
}
@Component({
  selector: 'app-faq-form',
  templateUrl: './faq-form.component.html',
  standalone: true,
  styleUrls: ['./faq-form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ]
})
export class FaqFormComponent implements OnInit {
  faqForm: FormGroup;
  isEdit: boolean = false;
  categories: FaqCategory[] = [];

  constructor(
    private fb: FormBuilder,
    private faqService: FaqService,
    private faqCategoryService: FaqCategoryService,
    public dialogRef: MatDialogRef<FaqFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { faq?: Faq; category?: FaqCategory }
  ) {
    this.faqForm = this.fb.group({
      question: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
      answer: ['', [Validators.required, Validators.minLength(3)]],
      category_id: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.getCategories();

    if (this.data.faq) {
      this.isEdit = true;
      console.log(this.data)
      
      this.faqForm.patchValue({
        question: this.data.faq.question,
        answer: this.data.faq.answer,
        category_id: Number(this.data.faq.category_id) || Number(this.data.category?.category_id)
      });
    } else if (this.data.category) {
      this.faqForm.patchValue({
        category_id: Number(this.data.category.category_id)
      });
    }
  }

  getCategories(): void {
    this.faqCategoryService.getAllCategories().subscribe({
      next: (response) => {
        if (response && Array.isArray(response.faqCategories)) {
          this.categories = response.faqCategories; // Mapea las categorías desde la respuesta del backend
          console.log(this.categories)
        } else {
          console.error('Datos de categorías no válidos:', response);
        }
      },
      error: (err) => console.error('Error obteniendo categorías:', err)
    });
  }

  saveFaq(): void {
    if (this.faqForm.invalid) return;
  
    const faqData = this.faqForm.value;
    console.log('Datos a enviar:', faqData);
    console.log('Datos a enviar:',  this.data);

    if (this.isEdit && this.data.faq?.id) {
      faqData.faq_id = this.data.faq.id;
      console.log('Modo edición - Datos con faq_id:', faqData);
  
      this.faqService.updateFaq(this.data.faq.id, faqData).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error actualizando FAQ:', err)
      });
    } else {
      console.log('Modo creación - Datos:', faqData);
      this.faqService.createFaq(faqData).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error creando FAQ:', err)
      });
    }
  }
}