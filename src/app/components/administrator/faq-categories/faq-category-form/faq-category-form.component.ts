import { Component, Inject, OnInit, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FaqCategoryService } from '../../../services/faq-category.service';
import { CommonModule } from '@angular/common'; // Importar CommonModule
import { ReactiveFormsModule } from '@angular/forms'; // Importar ReactiveFormsModule
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-faq-category-form',
  standalone: true,
  templateUrl: './faq-category-form.component.html',
  styleUrls: ['./faq-category-form.component.scss'],
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule
  ]
})
export class FaqCategoryFormComponent implements OnInit {
  categoryForm: FormGroup;
  isEdit: boolean = false;

  @Output() categorySaved = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private faqCategoryService: FaqCategoryService,
    public dialogRef: MatDialogRef<FaqCategoryFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {
    if (this.data) {
      this.isEdit = true;
      this.categoryForm.patchValue(this.data);
    }
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return;

    const categoryData = this.categoryForm.value;

    if (this.isEdit) {
      this.faqCategoryService.updateCategory(this.data.id, categoryData).subscribe({
        next: () => this.onSuccess(),
        error: (err) => console.error('Error al actualizar la categoría:', err)
      });
    } else {
      this.faqCategoryService.createCategory(categoryData).subscribe({
        next: () => this.onSuccess(),
        error: (err) => console.error('Error al crear la categoría:', err)
      });
    }
  }

  private onSuccess(): void {
    this.categorySaved.emit();
    this.dialogRef.close(true);
  }
}
