import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { BadgeHistoryComponent } from './badge-history.component';
import { AbstractControl, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  BadgeService,
  BadgeMetrics,
  AcquisitionTrendItem,
  UserBadgeGroup,
  NestedBadge,
} from '../../../../services/badge.service';
import { BadgeCategoryService, BadgeCategory } from '../../../../services/badge-category.service';
import { ToastService } from '../../../../services/toastService';
import { DatePipe, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { of, throwError } from 'rxjs';
import { Component, Input, Directive } from '@angular/core';
import { NgChartsModule } from 'ng2-charts';

// Registrar los datos de localización para español
registerLocaleData(localeEs);

// Mock de la directiva BaseChartDirective
@Directive({
  selector: '[baseChart]',
  standalone: true,
})
class MockBaseChartDirective {
  @Input() data: any;
  @Input() type: any;
  @Input() options: any;
  @Input() plugins: any;
}

// Stub para PaginationComponent
@Component({
  selector: 'app-pagination',
  template: '',
})
class PaginationStubComponent {
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;
  @Input() itemsPerPage: number = 10;
}

// Mock de Datos
const mockCategories: BadgeCategory[] = [
  {
    badge_category_id: 1,
    name: 'Compra',
    description: 'Desc',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    badges: [],
  },
];
const mockBadges = {
  badges: [{ badge_id: 1, name: 'Estrella', icon_url: 'url1' }],
  total: 1,
  page: 1,
  pageSize: 1000,
};

const mockMetrics: BadgeMetrics = {
  totalBadgesObtained: 150,
  uniqueUsersCount: 50,
  badgeDistribution: [
    { badge_id: 1, badge_name: 'Estrella', count: 100, category_name: 'Compra', icon_url: 'url_estrella.png' },
    { badge_id: 2, badge_name: 'Novato', count: 50, category_name: 'General', icon_url: 'url_novato.png' },
  ],
};
const mockTrend: AcquisitionTrendItem[] = [
  { date: '2025-01-01', count: 5 },
  { date: '2025-01-02', count: 10 },
];

const mockHistory: UserBadgeGroup[] = [
  {
    user_id: 101,
    user_name: 'Usuario Prueba',
    user_email: 'test@mail.com',
    total_badges: 2,
    last_obtained_at: '2025-10-25T10:00:00Z',
    badges: [
      {
        user_badge_id: 1001,
        badge_id: 1,
        badge_name: 'Estrella',
        badge_category: 'Compra',
        icon_url: 'url1',
        obtained_at: '2025-10-25T10:00:00Z',
        category_name: 'Compra',
      } as NestedBadge,
      {
        user_badge_id: 1002,
        badge_id: 2,
        badge_name: 'Novato',
        badge_category: 'General',
        icon_url: 'url2',
        obtained_at: '2025-10-24T10:00:00Z',
        category_name: 'General',
      } as NestedBadge,
    ],
  },
];

// Mock para BadgeService
class MockBadgeService {
  getBadgeMetrics = jest.fn().mockReturnValue(of({ metrics: mockMetrics }));
  getAcquisitionTrend = jest.fn().mockReturnValue(of({ trend: mockTrend }));
  getAllBadges = jest.fn().mockReturnValue(of(mockBadges));
  getGrantedBadgesHistory = jest.fn().mockReturnValue(of({ history: mockHistory, total: 1 }));
}

// Mock para BadgeCategoryService
class MockBadgeCategoryService {
  getAllBadgeCategories = jest.fn().mockReturnValue(of({ badgeCategories: mockCategories }));
}

// Mock para ToastService
class MockToastService {
  showToast = jest.fn();
}

describe('BadgeHistoryComponent', () => {
  let component: BadgeHistoryComponent;
  let fixture: ComponentFixture<BadgeHistoryComponent>;
  let badgeService: MockBadgeService;
  let categoryService: MockBadgeCategoryService;
  let toastService: MockToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BadgeHistoryComponent,
        ReactiveFormsModule,
        NgChartsModule,
        MockBaseChartDirective, // Move MockBaseChartDirective to imports
      ],
      declarations: [PaginationStubComponent], // Keep PaginationStubComponent in declarations
      providers: [
        FormBuilder,
        DatePipe,
        { provide: BadgeService, useClass: MockBadgeService },
        { provide: BadgeCategoryService, useClass: MockBadgeCategoryService },
        { provide: ToastService, useClass: MockToastService },
        { provide: 'LOCALE_ID', useValue: 'es' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeHistoryComponent);
    component = fixture.componentInstance;
    badgeService = TestBed.inject(BadgeService) as unknown as MockBadgeService;
    categoryService = TestBed.inject(BadgeCategoryService) as unknown as MockBadgeCategoryService;
    toastService = TestBed.inject(ToastService) as unknown as MockToastService;

    fixture.detectChanges();
  });

  it('should create and load initial data on init', () => {
    expect(component).toBeTruthy();
    expect(badgeService.getBadgeMetrics).toHaveBeenCalled();
    expect(badgeService.getAcquisitionTrend).toHaveBeenCalled();
    expect(categoryService.getAllBadgeCategories).toHaveBeenCalled();
    expect(badgeService.getAllBadges).toHaveBeenCalled();
    expect(badgeService.getGrantedBadgesHistory).toHaveBeenCalled();
    expect(component.metrics).toEqual(mockMetrics);
    expect(component.badgeCategories.length).toBe(1);
    expect(component.badgeOptions.length).toBe(1);
    expect(component.historyList.length).toBe(1);
    expect(component.trendData).toEqual(mockTrend);
  });

  it('should handle error when loading history', () => {
    badgeService.getGrantedBadgesHistory.mockReturnValue(throwError(() => ({ error: { message: 'Error historial' } })));
    component.historyList = [];
    component.loadHistory();
    expect(toastService.showToast).toHaveBeenCalledWith('Error historial', 'error');
    expect(component.isLoadingHistory).toBe(false);
    expect(component.historyList.length).toBe(0);
  });

  it('should call loadHistory with new page on onHistoryPageChange', () => {
    const loadSpy = jest.spyOn(component, 'loadHistory');
    loadSpy.mockClear();
    component.onHistoryPageChange(2);
    expect(component.historyCurrentPage).toBe(2);
    expect(component.expandedUserId).toBeNull();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should reset page and call loadHistory on onHistoryItemsPerPageChange', () => {
    const loadSpy = jest.spyOn(component, 'loadHistory');
    loadSpy.mockClear();
    component.historyCurrentPage = 3;
    component.historyItemsPerPage = 20;
    component.onHistoryItemsPerPageChange();
    expect(component.historyCurrentPage).toBe(1);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should toggle user expansion', () => {
    expect(component.expandedUserId).toBeNull();
    component.toggleUserExpansion(101);
    expect(component.expandedUserId).toBe(101);
    component.toggleUserExpansion(101);
    expect(component.expandedUserId).toBeNull();
  });

  it('should debounce value changes and call loadHistory/loadTrendData only once', fakeAsync(() => {
    const historySpy = jest.spyOn(component, 'loadHistory').mockImplementation(() => {});
    const trendSpy = jest.spyOn(component, 'loadTrendData').mockImplementation(() => {});
    historySpy.mockClear();
    trendSpy.mockClear();
    component.historyFilterForm.get('search')?.setValue('user');
    tick(200);
    component.historyFilterForm.get('search')?.setValue('user 101');
    tick(400);
    tick(100);
    expect(historySpy).toHaveBeenCalledTimes(1);
    expect(trendSpy).toHaveBeenCalledTimes(1);
    expect(component.historyCurrentPage).toBe(1);
    flush();
  }));

  it('should not call loadHistory if the form becomes invalid', fakeAsync(() => {
    const historySpy = jest.spyOn(component, 'loadHistory').mockImplementation(() => {});
    historySpy.mockClear();
    component.historyFilterForm.get('userId')?.setValue('abc');
    tick(500);
    expect(historySpy).not.toHaveBeenCalled();
    expect(component.historyFilterForm.invalid).toBe(true);
    component.historyFilterForm.get('userId')?.setValue('123');
    tick(500);
    expect(historySpy).toHaveBeenCalledTimes(1);
    flush();
  }));

  it('idValidator should return null for valid ID (number > 0)', () => {
    const validControl = { value: '123' } as unknown as AbstractControl;
    expect(component.idValidator(validControl)).toBeNull();
  });

  it('idValidator should return null for null/empty value (optional field)', () => {
    const nullControl = { value: null } as unknown as AbstractControl;
    const emptyControl = { value: '' } as unknown as AbstractControl;
    expect(component.idValidator(nullControl)).toBeNull();
    expect(component.idValidator(emptyControl)).toBeNull();
  });

  it('idValidator should return invalidId for non-numeric/zero/negative values', () => {
    const control1 = { value: 'abc' } as unknown as AbstractControl;
    const control2 = { value: '0' } as unknown as AbstractControl;
    const control3 = { value: '-1' } as unknown as AbstractControl;
    expect(component.idValidator(control1)).toEqual({ invalidId: true });
    expect(component.idValidator(control2)).toEqual({ invalidId: true });
    expect(component.idValidator(control3)).toEqual({ invalidId: true });
  });
});