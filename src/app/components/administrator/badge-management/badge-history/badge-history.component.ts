import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, AbstractControl } from '@angular/forms';
import { BadgeService, UserBadgeGroup, NestedBadge, BadgeMetrics, AcquisitionTrendItem } from '../../../../services/badge.service';
import { BadgeCategoryService, BadgeCategory } from '../../../../services/badge-category.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { ToastService } from '../../../../services/toastService';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
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
    NgChartsModule,
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
  barChartType: ChartType = 'bar';
  totalHistoryItems = 0;
  historyCurrentPage = 1;
  historyItemsPerPage = 10;
  historyTotalPages = 1;
  historyFilterForm!: FormGroup;
  historySort: 'obtained_at:DESC' | 'obtained_at:ASC' = 'obtained_at:DESC';
  isLoadingHistory = false;
  metrics: BadgeMetrics | null = null;
  badgeCategories: BadgeCategory[] = [];
  badgeOptions: BadgeOption[] = [];
  expandedUserId: number | null = null;
  trendData: AcquisitionTrendItem[] = [];

  // Configuración del gráfico de barras (existente)
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    layout: { padding: { left: 10, right: 30 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        callbacks: {
          label: (context) => `${context.parsed.x.toLocaleString()} Insignias`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 10 } },
        grid: { color: '#e5e7eb' },
        title: { display: true, text: 'Cantidad de Insignias' }
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          color: '#4b5563',
          callback: function (value, index, ticks) {
            const label = this.getLabelForValue(value as number);
            return label.length > 25 ? label.slice(0, 25) + '…' : label;
          },
        },
        min: 0,
      },
    },
  };
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Insignias', backgroundColor: '#3b82f6', borderRadius: 4 }]
  };

  // Configuración del nuevo gráfico de tendencias
  trendChartType: ChartType = 'line';
  trendChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        callbacks: {
          label: (context) => `${context.parsed.y.toLocaleString()} Insignias`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#e5e7eb' },
        ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 },
        title: { display: true, text: 'Fecha' }
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 10 } },
        grid: { color: '#e5e7eb' },
        title: { display: true, text: 'Insignias Otorgadas' }
      },
    },
  };
  trendChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{ 
      data: [], 
      label: 'Insignias Diarias', 
      borderColor: '#10b981', 
      backgroundColor: 'rgba(16, 185, 129, 0.2)', 
      fill: true,
      tension: 0.4 
    }]
  };

  private subscriptions: Subscription = new Subscription();

  constructor(
    private badgeService: BadgeService,
    private badgeCategoryService: BadgeCategoryService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef
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
    this.loadBadgeOptions();
    this.loadMetrics();
    this.loadHistory();
    this.loadTrendData();
    this.setupHistoryFormSubscription();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadMetrics(): void {
    this.subscriptions.add(
      this.badgeService.getBadgeMetrics().subscribe({
        next: (response) => {
          this.metrics = response.metrics;
          const maxBars = window.innerWidth < 640 ? 3 : window.innerWidth < 1024 ? 5 : 7;
          this.barChartData = {
            labels: (this.metrics?.badgeDistribution || [])
              .slice(0, maxBars)
              .map(b => b.badge_name || ''),
            datasets: [
              {
                data: (this.metrics?.badgeDistribution || [])
                  .slice(0, maxBars)
                  .map(b => b.count || 0),
                label: 'Insignias',
                backgroundColor: '#3b82f6',
                borderRadius: 4,
              },
            ],
          };
          this.cdr.detectChanges();
        },
        error: (err) => {
          const msg = err?.error?.message || 'Error al cargar las métricas de insignias';
          this.toastService.showToast(msg, 'error');
        }
      })
    );
  }

  loadTrendData(): void {
    this.subscriptions.add(
      this.badgeService.getAcquisitionTrend(30).subscribe({
        next: (response) => {
          console.log(response)
          this.trendData = response.trend;
          this.trendChartData = {
            labels: this.trendData.map(item => this.datePipe.transform(item.date, 'd/MM', undefined, 'es') || item.date),
            datasets: [{
              data: this.trendData.map(item => item.count),
              label: 'Insignias Diarias',
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              fill: true,
              tension: 0.4
            }]
          };
          this.cdr.detectChanges();
        },
        error: (err) => {
          const msg = err?.error?.message || 'Error al cargar las tendencias de adquisición';
          this.toastService.showToast(msg, 'error');
        }
      })
    );
  }

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
          this.loadTrendData(); // Reload trend data when filters change
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