import { Component, Inject, OnInit, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FaqCategoryService } from '../../../services/faq-category.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-faq-category-form',
  standalone: true,
  templateUrl: './faq-category-form.component.html',
  styleUrls: ['./faq-category-form.component.css'],
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
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sanitizer: DomSanitizer
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(500),
        this.noNumbersValidator,
        this.noSpecialCharsValidator,
        this.noSQLInjectionValidator
      ]],
      description: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(500),
        this.noNumbersValidator,
        this.noSpecialCharsValidator,
        this.noSQLInjectionValidator
      ]]
    });
  }

  ngOnInit(): void {
    if (this.data) {
      this.isEdit = true;
      this.categoryForm.patchValue(this.data);
    }
  }

  noSpecialCharsValidator(control: any) {
    const hasDangerousChars = /[<>'"`;]/.test(control.value);
    return hasDangerousChars ? { invalidContent: true } : null;
  }

  noNumbersValidator(control: any) {
    const hasNumbers = /\d/.test(control.value);
    return hasNumbers ? { invalidContent: true } : null;
  }

  noSQLInjectionValidator(control: any) {
    const sqlKeywords = /(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|EXEC|UNION|GRANT|REVOKE)/i;
    return sqlKeywords.test(control.value) ? { invalidContent: true } : null;
  }

  sanitizeInput(input: string): string {
    return input.replace(/[<>'"`;]/g, '').replace(/(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|EXEC|UNION|GRANT|REVOKE)/gi, '');
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return;

    const categoryData = {
      name: this.sanitizeInput(this.categoryForm.value.name),
      description: this.sanitizeInput(this.categoryForm.value.description)
    };

    if (this.isEdit) {
      this.faqCategoryService.updateCategory(this.data.category_id, categoryData).subscribe({
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
