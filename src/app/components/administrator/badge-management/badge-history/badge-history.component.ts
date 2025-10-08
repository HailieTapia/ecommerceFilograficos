import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, AbstractControl } from '@angular/forms';
import { BadgeService, UserBadgeGroup, NestedBadge } from '../../../../services/badge.service';
import { BadgeCategoryService, BadgeCategory } from '../../../../services/badge-category.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { ToastService } from '../../../../services/toastService';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';

interface BadgeOption {
  badge_id: number;
  badge_name: string;
}

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
  historyList: UserBadgeGroup[] = [];
  totalHistoryItems = 0;
  historyCurrentPage = 1;
  historyItemsPerPage = 10;
  historyTotalPages = 1;
  historyFilterForm!: FormGroup;
  historySort: 'obtained_at:DESC' | 'obtained_at:ASC' = 'obtained_at:DESC';
  isLoadingHistory = false;

  badgeCategories: BadgeCategory[] = [];
  badgeOptions: BadgeOption[] = []; // 🆕 Lista de insignias para el select

  expandedUserId: number | null = null;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private badgeService: BadgeService,
    private badgeCategoryService: BadgeCategoryService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.historyFilterForm = this.fb.group({
      userId: ['', [this.idValidator]],
      badgeId: ['', [this.idValidator]],
      badgeCategoryId: ['', [this.idValidator]],
      search: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadBadgeCategories();
    this.loadBadgeOptions(); // 🆕 Cargar insignias para el select
    this.loadHistory();
    this.setupHistoryFormSubscription();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // 🆕 Cargar lista de insignias disponibles
  loadBadgeOptions(): void {
    this.subscriptions.add(
      this.badgeService.getAllBadges(1, 1000, '', 'active').subscribe({
        next: (response) => {
          this.badgeOptions = response.badges.map((b: any) => ({
            badge_id: b.badge_id,
            badge_name: b.name
          }));
        },
        error: (err) => {
          const msg = err?.error?.message || 'Error al cargar las insignias';
          this.toastService.showToast(msg, 'error');
        }
      })
    );
  }

  loadBadgeCategories(): void {
    this.subscriptions.add(
      this.badgeCategoryService.getAllBadgeCategories(1, 100, '', 'active').subscribe({
        next: (response) => {
          this.badgeCategories = response.badgeCategories;
        },
        error: (err) => {
          const msg = err?.error?.message || 'Error al cargar las categorías de insignias';
          this.toastService.showToast(msg, 'error');
        }
      })
    );
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
    const sortParam =
      this.historySort === 'obtained_at:DESC' ? 'last_obtained_at:DESC' : 'last_obtained_at:ASC';

    this.subscriptions.add(
      this.badgeService.getGrantedBadgesHistory(
        this.historyCurrentPage,
        this.historyItemsPerPage,
        filters.userId ? parseInt(filters.userId) : undefined,
        filters.badgeId ? parseInt(filters.badgeId) : undefined,
        filters.badgeCategoryId ? parseInt(filters.badgeCategoryId) : undefined,
        filters.startDate,
        filters.endDate,
        filters.search,
        sortParam
      ).subscribe({
        next: (response) => {
          this.historyList = response.history;
          this.totalHistoryItems = response.total;
          this.historyTotalPages = Math.ceil(response.total / this.historyItemsPerPage);
          this.isLoadingHistory = false;
        },
        error: (err) => {
          const msg = err?.error?.message || 'Error al cargar el historial de insignias';
          this.toastService.showToast(msg, 'error');
          this.isLoadingHistory = false;
        }
      })
    );
  }

  onHistoryPageChange(newPage: number): void {
    this.historyCurrentPage = newPage;
    this.expandedUserId = null;
    this.loadHistory();
  }

  onHistoryItemsPerPageChange(): void {
    this.historyCurrentPage = 1;
    this.expandedUserId = null;
    this.loadHistory();
  }

  onHistorySortChange(): void {
    this.historyCurrentPage = 1;
    this.expandedUserId = null;
    this.loadHistory();
  }

  toggleUserExpansion(userId: number): void {
    this.expandedUserId = this.expandedUserId === userId ? null : userId;
  }

  idValidator(control: AbstractControl) {
    if (!control.value) return null;
    const value = control.value;
    const isValid = /^\d+$/.test(value) && parseInt(value) > 0;
    return isValid ? null : { invalidId: true };
  }

  formatDateTime(date: string): string {
    return this.datePipe.transform(date, 'd/MM/yyyy h:mm a', undefined, 'es') || 'Fecha no disponible';
  }
}