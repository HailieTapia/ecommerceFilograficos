import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecommendationService } from '../components/services/recommendation.service';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-recommendation',
  standalone: true,
  imports: [RouterModule,CommonModule, FormsModule],
  templateUrl: './recommendation.component.html',
  styleUrls: ['./recommendation.component.css']
})
export class RecommendationComponent implements OnInit {
  @Input() set product(value: string) {
    this._product = value?.trim() || ''; // Añade trim para evitar espacios innecesarios
    if (this._product) this.getRecommendations();
  }
  public _product: string = '';
  recommendations: { name: string }[] = [];
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private recommendationService: RecommendationService) {} 

  ngOnInit() {
  }

  getRecommendations() {
    if (!this._product) {
      this.errorMessage = 'Por favor ingresa un producto';
      this.recommendations = [];
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.recommendationService.getRecommendations2(this._product).subscribe({
      next: (response) => {
        this.recommendations = Array.isArray(response.data.recommendations) ? response.data.recommendations : [];
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al obtener recomendaciones: ' + (error.message || 'Intenta de nuevo');
        this.recommendations = [];
        this.isLoading = false;
        console.error(error);
      }
    });
  }
}


