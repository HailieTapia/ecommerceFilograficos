import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-filters-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './filters-panel.component.html',
  styleUrls: ['./filters-panel.component.css'],
})
export class FiltersPanelComponent implements OnInit {
  @Output() filtersChanged = new EventEmitter<any>(); // Emite los filtros seleccionados
  filtersForm: FormGroup;
  activeFilters: { key: string; value: string }[] = []; // Filtros activos

  constructor(private fb: FormBuilder) {
    this.filtersForm = this.fb.group({
      status: [''], // Estado: pending, in_progress, resolved, closed
      contact_channel: [''], // Canal de contacto: email, phone, web, chat
      response_channel: [''], // Canal de respuesta: email, phone, portal, sms
      user_id: [''], // Tipo de usuario: "registered" (registrados), "null" (no registrados)
      startDate: [''], // Fecha de inicio
      endDate: [''], // Fecha de fin
    });
  }

  ngOnInit(): void {
    // Cargar filtros guardados en localStorage
    const savedFilters = localStorage.getItem('supportFilters');
    if (savedFilters) {
      const filters = JSON.parse(savedFilters);
      this.filtersForm.patchValue(filters);
      this.updateActiveFilters(filters);
    }

    // Escuchar cambios en el formulario
    this.filtersForm.valueChanges.subscribe((filters) => {
      this.updateActiveFilters(filters);
      this.filtersChanged.emit(filters);
      localStorage.setItem('supportFilters', JSON.stringify(filters)); // Guardar en localStorage
    });
  }

  // Actualizar la lista de filtros activos
  updateActiveFilters(filters: any): void {
    this.activeFilters = Object.keys(filters)
      .filter((key) => filters[key]) // Solo incluir filtros con valor
      .map((key) => ({
        key,
        value: this.getFilterDisplayValue(key, filters[key]),
      }));
  }

  // Obtener el valor legible de un filtro
  getFilterDisplayValue(key: string, value: string): string {
    switch (key) {
      case 'status':
        return `Estado: ${this.getStatusText(value)}`;
      case 'contact_channel':
        return `Canal de Contacto: ${value}`;
      case 'response_channel':
        return `Canal de Respuesta: ${value}`;
      case 'user_id':
        return value === 'registered' ? 'Usuarios Registrados' : 'Usuarios No Registrados';
      case 'startDate':
        return `Desde: ${value}`;
      case 'endDate':
        return `Hasta: ${value}`;
      default:
        return value;
    }
  }

  // Reiniciar todos los filtros
  resetFilters(): void {
    this.filtersForm.reset();
    localStorage.removeItem('supportFilters'); // Eliminar filtros guardados
  }

  // Eliminar un filtro activo
  removeFilter(key: string): void {
    this.filtersForm.get(key)?.setValue(''); // Reiniciar el filtro
  }

  // Obtener texto legible para el estado
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendiente',
      in_progress: 'En Proceso',
      resolved: 'Resuelto',
      closed: 'Cerrado',
    };
    return statusMap[status] || status;
  }
}