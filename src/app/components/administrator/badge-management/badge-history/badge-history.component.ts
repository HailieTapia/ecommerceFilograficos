// badge-history.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, AbstractControl } from '@angular/forms'; // Added AbstractControl import
import { BadgeService, GrantedBadgeHistoryItem } from '../../../../services/badge.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { ToastService } from '../../../../services/toastService';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-badge-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
    DatePipe
  ],
  templateUrl: './badge-history.component.html',
  styleUrls: ['./badge-history.component.css'],
  providers: [
    DatePipe,
    { provide: 'LOCALE_ID', useValue: 'es' }
  ]
})
export class BadgeHistoryComponent implements OnInit, OnDestroy {
  historyList: GrantedBadgeHistoryItem[] = [];
  totalHistoryItems = 0;
  historyCurrentPage = 1;
  historyItemsPerPage = 10;
  historyTotalPages = 1;
  historyFilterForm!: FormGroup;
  historySort: 'obtained_at:DESC' | 'obtained_at:ASC' = 'obtained_at:DESC';
  isLoadingHistory = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private badgeService: BadgeService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.historyFilterForm = this.fb.group({
      userId: ['', [this.idValidator]],
      badgeId: ['', [this.idValidator]],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadHistory();
    this.setupHistoryFormSubscription();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  setupHistoryFormSubscription(): void {
    this.subscriptions.add(
      this.historyFilterForm.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      ).subscribe(() => {
        if (this.historyFilterForm.valid) {
          this.historyCurrentPage = 1;
          this.loadHistory();
        }
      })
    );
  }

  loadHistory(): void {
    if (this.historyFilterForm.invalid) return;

    this.isLoadingHistory = true;
    const filters = this.historyFilterForm.value;

    this.subscriptions.add(
      this.badgeService.getGrantedBadgesHistory(
        this.historyCurrentPage,
        this.historyItemsPerPage,
        filters.userId ? parseInt(filters.userId) : undefined,
        filters.badgeId ? parseInt(filters.badgeId) : undefined,
        filters.startDate,
        filters.endDate,
        this.historySort
      ).subscribe({
        next: (response) => {
          this.historyList = response.history;
          this.totalHistoryItems = response.total;
          this.historyTotalPages = Math.ceil(response.total / this.historyItemsPerPage);
          this.isLoadingHistory = false;
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar el historial de insignias';
          this.toastService.showToast(errorMessage, 'error');
          this.isLoadingHistory = false;
        }
      })
    );
  }

  onHistoryPageChange(newPage: number): void {
    this.historyCurrentPage = newPage;
    this.loadHistory();
  }

  onHistoryItemsPerPageChange(): void {
    this.historyCurrentPage = 1;
    this.loadHistory();
  }

  onHistorySortChange(): void {
    this.historyCurrentPage = 1;
    this.loadHistory();
  }

  idValidator(control: AbstractControl) {
    if (!control.value) return null;
    const value = control.value;
    const isValidNumber = /^\d+$/.test(value) && parseInt(value) > 0;
    return isValidNumber ? null : { invalidId: true };
  }

  formatDateTime(date: string): string {
    return this.datePipe.transform(date, "d/MM/yyyy h:mm a", undefined, 'es') || 'Fecha no disponible';
  }
}