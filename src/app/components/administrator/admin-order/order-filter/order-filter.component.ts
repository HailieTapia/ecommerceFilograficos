import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-order-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './order-filter.component.html'
})
export class OrderFilterComponent implements OnChanges {
  @Input() searchTerm: string = '';
  @Input() statusFilter: string = 'all';
  @Input() dateFilter: string = 'delivery';

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() statusFilterChange = new EventEmitter<string>();
  @Output() dateFilterChange = new EventEmitter<'delivery' | 'creation'>();

  filterForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      statusFilter: ['all'],
      dateFilter: ['delivery']
    });

    this.filterForm.valueChanges.subscribe(values => {
      this.searchTermChange.emit(values.searchTerm);
      this.statusFilterChange.emit(values.statusFilter);
      if (values.dateFilter === 'delivery' || values.dateFilter === 'creation') {
        this.dateFilterChange.emit(values.dateFilter);
      } else {
        console.warn('Valor inválido para dateFilter:', values.dateFilter);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.filterForm.patchValue({
      searchTerm: this.searchTerm,
      statusFilter: this.statusFilter,
      dateFilter: this.dateFilter
    }, { emitEvent: false });
  }
}