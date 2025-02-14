import { Component, Inject, OnInit, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FaqService } from '../../../services/faq.service';
import { FaqCategoryService } from '../../../services/faq-category.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';


@Component({
  selector: 'app-faq-form',
  standalone: true,
  templateUrl: './faq-form.component.html',
  styleUrls: ['./faq-form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDialogModule
  ]
})
export class FaqFormComponent implements OnInit {
  faqForm: FormGroup;
  isEdit: boolean = false;
  categories: any[] = [];

  @Output() faqSaved = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private faqService: FaqService,
    private faqCategoryService: FaqCategoryService,
    public dialogRef: MatDialogRef<FaqFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.faqForm = this.fb.group({
      category_id: ['', Validators.required],
      question: ['', [Validators.required, Validators.minLength(5)]],
      answer: ['', [Validators.required, Validators.minLength(5)]],
      status: ['active', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    if (this.data) {
      this.isEdit = true;
      this.faqForm.patchValue(this.data);
    }
  }

  loadCategories(): void {
    this.faqCategoryService.getAllCategories().subscribe({
      next: (response) => {
        if (response && Array.isArray(response.faqCategories)) {
          this.categories = response.faqCategories;
        } else {
          console.error('Error: la API no devolvió un array válido', response);
          this.categories = []; // Evita problemas en el template
        }
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.categories = []; // Evita errores en la vista
      }
    });
  }
  

  saveFaq(): void {
    if (this.faqForm.invalid) return;

    const faqData = this.faqForm.value;

    if (this.isEdit) {
      this.faqService.updateFaq(this.data.id, faqData).subscribe({
        next: () => this.onSuccess(),
        error: (err) => console.error('Error al actualizar la pregunta frecuente:', err)
      });
    } else {
      this.faqService.createFaq(faqData).subscribe({
        next: () => this.onSuccess(),
        error: (err) => console.error('Error al crear la pregunta frecuente:', err)
      });
    }
  }

  private onSuccess(): void {
    this.faqSaved.emit();
    this.dialogRef.close(true);
  }
}
