import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup,ReactiveFormsModule, Validators } from '@angular/forms';
import { CategorieService } from '../../services/categorieService';
import { ModalComponent } from '../../../modal/modal.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule,ModalComponent,ReactiveFormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit, AfterViewInit {
  @ViewChild('modal') modal!: ModalComponent;
  categories: any[] = []; 
  categoryForm!: FormGroup;

  constructor(private categoriesService: CategorieService, private fb: FormBuilder) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.getAllCategories();
  }

  ngAfterViewInit(): void {
    if (!this.modal) {
      console.error("El modal no está inicializado correctamente.");
    }
  }

  // Obtener todas las categorías
  getAllCategories(): void {
    this.categoriesService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        console.error('Error al obtener categorías:', err);
      }
    });
  }

  // Abrir modal para crear categoría
  openModal(): void {
    this.categoryForm.reset();
    this.modal.open();
  }

  // Crear categoría
  createCategory(): void {
    if (this.categoryForm.invalid) {
      alert('Formulario inválido. Revisa los campos.');
      return;
    }

    const categoryData = this.categoryForm.value;
    this.categoriesService.createCategory(categoryData).subscribe({
      next: (data) => {
        alert('Categoría creada exitosamente');
        this.getAllCategories();
        this.modal.close();
      },
      error: (err) => {
        console.error('Error al crear categoría:', err);
      }
    });
  }
}
