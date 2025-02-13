import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidenceService } from '../../services/incidence.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-incidence',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './incidence.component.html',
  styleUrl: './incidence.component.css'
})
export class IncidenceComponent {

  failedAttempts: any[] = [];
  failedLoginAttempts: any[] = [];
  selectedPeriodo: string = 'dia';

  constructor(private incidenceService: IncidenceService,) {
  }

  ngOnInit(): void {
    this.getFailedLoginAttempts(this.selectedPeriodo);
  }

  onPeriodoChange(): void {
    this.getFailedLoginAttempts(this.selectedPeriodo);
  }

  getFailedLoginAttempts(periodo: string): void {
    this.incidenceService.getFailedLoginAttempts(periodo).subscribe(
      (data) => {
        console.log('Intentos fallidos:', data);
        this.failedLoginAttempts = [
          ...(data?.clientes || []),
          ...(data?.administradores || [])
        ];
      },
      (error) => {
        const errorMessage = error?.error?.message || 'Error al obtener intentos fallidos';
        console.error('Error al obtener intentos fallidos:', errorMessage);
      }
    );
  }
}
