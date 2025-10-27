import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { BadgeCategoryManagementComponent } from './badge-category-management.component';
import { BadgeCategoryService, BadgeCategory, BadgeDistributionReportItem } from '../../../services/badge-category.service';
import { ToastService } from '../../../services/toastService';
import { of, Subject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { FormBuilder, AbstractControl, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { expect } from '@jest/globals';
import { EventEmitter, Component, Input, Output, NO_ERRORS_SCHEMA } from '@angular/core';

// Stub para ModalComponent
@Component({
  selector: 'app-modal',
  template: ''
})
class ModalStubComponent {
  @Input() title: string = '';
  @Input() modalType: string = 'default';
  @Input() isConfirmModal: boolean = false;
  @Input() confirmText: string = '';
  @Input() cancelText: string = '';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  open = jest.fn();
  close = jest.fn();
}

// Mock para BadgeCategoryService
class MockBadgeCategoryService {
  defaultCategories = {
    badgeCategories: [
      { badge_category_id: 1, name: 'Compra', description: 'Logros de compra', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01', badges: [] },
    ] as BadgeCategory[],
    total: 1,
    page: 1,
    pageSize: 10,
  };

  getAllBadgeCategories = jest.fn().mockReturnValue(of(this.defaultCategories));
  getBadgeDistributionReport = jest.fn().mockReturnValue(of({ message: 'OK', report: [] }));
  getBadgeCategoryById = jest.fn().mockReturnValue(of({ badgeCategory: this.defaultCategories.badgeCategories[0] }));
  createBadgeCategory = jest.fn().mockReturnValue(of({}));
  updateBadgeCategory = jest.fn().mockReturnValue(of({}));
  deleteBadgeCategory = jest.fn().mockReturnValue(of({}));
}

// Mock para ToastService
class MockToastService {
  showToast = jest.fn();
}

describe('BadgeCategoryManagementComponent', () => {
  let component: BadgeCategoryManagementComponent;
  let fixture: ComponentFixture<BadgeCategoryManagementComponent>;
  let categoryService: MockBadgeCategoryService;
  let toastService: MockToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeCategoryManagementComponent],
      declarations: [ModalStubComponent],
      providers: [
        FormBuilder,
        DatePipe,
        { provide: BadgeCategoryService, useClass: MockBadgeCategoryService },
        { provide: ToastService, useClass: MockToastService },
        { provide: 'LOCALE_ID', useValue: 'es' }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeCategoryManagementComponent);
    component = fixture.componentInstance;
    categoryService = TestBed.inject(BadgeCategoryService) as unknown as MockBadgeCategoryService;
    toastService = TestBed.inject(ToastService) as unknown as MockToastService;

    // Asignar instancias de ModalStubComponent a los ViewChild
    component.createEditModal = new ModalStubComponent() as any;
    component.confirmModal = new ModalStubComponent() as any;
    component.reportModal = new ModalStubComponent() as any;
  });

  it('should create and load categories on init', fakeAsync(() => {
    const loadSpy = jest.spyOn(component, 'loadBadgeCategories');
    fixture.detectChanges(); // Ejecutar ngOnInit
    expect(component).toBeTruthy();
    expect(loadSpy).toHaveBeenCalled();
    expect(component.badgeCategories.length).toBe(1);
  }));

  it('should call loadBadgeCategories with correct page and itemsPerPage change', () => {
    const loadSpy = jest.spyOn(component, 'loadBadgeCategories');
    component.itemsPerPage = 20;
    component.onItemsPerPageChange();
    expect(component.currentPage).toBe(1);
    expect(loadSpy).toHaveBeenCalled();
  });

it('should debounce search term and call loadCategories with correct parameters', fakeAsync(() => {
      // 0. Setup: Inicializar el componente y limpiar la llamada de ngOnInit
      const loadSpy = jest.spyOn(component, 'loadBadgeCategories');

      fixture.detectChanges(); // Ejecuta ngOnInit y establece la suscripción del debounce.
      tick(); // Permite que la llamada loadBadgeCategories() de ngOnInit se complete (microtarea).
      loadSpy.mockClear(); // Limpia el historial de llamadas del spy para iniciar la cuenta en 0.

      // 1. Primer cambio: Inicia el debounce (300ms)
      component.searchTerm = 'testing';
      component.onSearchChange();
      expect(loadSpy).not.toHaveBeenCalled(); 

      // 2. tick(200): Pasan 200ms
      tick(200);
      
      // 3. Segundo cambio (antes del final del primer debounce): Reinicia el debounce (otros 300ms)
      component.searchTerm = 'test';
      component.onSearchChange();
      expect(loadSpy).not.toHaveBeenCalled(); // PASA: el debounce se reinició

      // 4. tick(300): El segundo debounce finaliza
      tick(300); // 🚀 Esta es la llamada clave que permite que la suscripción se ejecute

      // 5. Verificación
      expect(loadSpy).toHaveBeenCalledTimes(1); // ✔️ Debería pasar ahora
      expect(categoryService.getAllBadgeCategories).toHaveBeenCalledWith(1, 10, 'test', 'active', 'badge_category_id:ASC', '');
      
      flush(); 
  }));

  it('should toggle sort direction when clicking the same column header', () => {
    component.onSortChange('badge_category_id');
    expect(component.sortDirection).toBe('DESC');
    expect(component.getSortIcon('badge_category_id')).toBe('fas fa-sort-down');

    component.onSortChange('name');
    expect(component.sortColumn).toBe('name');
    expect(component.sortDirection).toBe('ASC');
    expect(component.getSortIcon('name')).toBe('fas fa-sort-up');
  });

  it('should open report modal and load distribution data on success', fakeAsync(() => {
    const mockReport: BadgeDistributionReportItem[] = [
      { category_id: 1, category_name: 'Compra', total_badges: 5 },
    ];
    const reportSubject = new Subject<{ message: string, report: BadgeDistributionReportItem[] }>();
    categoryService.getBadgeDistributionReport.mockReturnValue(reportSubject.asObservable());

    component.openReportModal();
    expect(component.isReportLoading).toBe(true);
    expect(component.reportModal.open).toHaveBeenCalled();

    reportSubject.next({ message: 'ok', report: mockReport });
    tick();
    fixture.detectChanges();

    expect(component.isReportLoading).toBe(false);
    expect(component.badgeDistributionReport).toEqual(mockReport);
  }));

  it('should handle error when generating report', fakeAsync(() => {
    const reportSubject = new Subject<{ message: string, report: BadgeDistributionReportItem[] }>();
    categoryService.getBadgeDistributionReport.mockReturnValue(reportSubject.asObservable());

    component.openReportModal();
    reportSubject.error({ error: { message: 'Report error' } });
    tick();

    expect(component.isReportLoading).toBe(false);
    expect(toastService.showToast).toHaveBeenCalledWith('Report error', 'error');
    expect(component.reportModal.close).toHaveBeenCalled();
  }));

  it('should open create modal and reset form', () => {
    component.categoryForm.patchValue({ name: 'Test', description: 'Desc' });
    component.openCreateModal();
    expect(component.selectedCategoryId).toBeNull();
    expect(component.categoryForm.get('name')?.value).toBeNull();
    expect(component.createEditModal.open).toHaveBeenCalled();
  });

  it('should open edit modal and patch form values on success', fakeAsync(() => {
    const mockCategory = categoryService.defaultCategories.badgeCategories[0];
    component.openEditModal(mockCategory);
    expect(categoryService.getBadgeCategoryById).toHaveBeenCalledWith('1');
    tick();
    expect(component.selectedCategoryId).toBe('1');
    expect(component.categoryForm.get('name')?.value).toBe(mockCategory.name);
    expect(component.createEditModal.open).toHaveBeenCalled();
  }));

  it('should call createCategory on save if selectedCategoryId is null', fakeAsync(() => {
    component.selectedCategoryId = null;
    component.categoryForm.patchValue({ name: 'New Cat', description: 'New Desc' });
    component.saveCategory();
    expect(categoryService.createBadgeCategory).toHaveBeenCalledWith({ name: 'New Cat', description: 'New Desc' });
    expect(categoryService.updateBadgeCategory).not.toHaveBeenCalled();
    tick();
    expect(toastService.showToast).toHaveBeenCalledWith(expect.any(String), 'success');
    expect(component.createEditModal.close).toHaveBeenCalled();
  }));

  it('should call updateCategory on save if selectedCategoryId is set', fakeAsync(() => {
    component.selectedCategoryId = '1';
    component.categoryForm.get('name')?.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(100)]);
    component.categoryForm.get('description')?.setValidators([Validators.maxLength(500)]);
    component.categoryForm.patchValue({ name: 'Safe Cat', description: 'Safe Desc' });
    component.categoryForm.updateValueAndValidity();

    component.saveCategory();
    expect(categoryService.updateBadgeCategory).toHaveBeenCalledWith('1', { name: 'Safe Cat', description: 'Safe Desc' });
    tick();
    expect(toastService.showToast).toHaveBeenCalledWith('Categoría actualizada exitosamente', 'success');
  }));

  it('should show confirmation modal before deleting a category', () => {
    const mockCategory = categoryService.defaultCategories.badgeCategories[0];
    component.deleteCategory(mockCategory);
    expect(component.confirmModal.open).toHaveBeenCalled();
    expect(component.confirmModalTitle).toContain('Eliminar Categoría');
    expect(component.confirmAction).not.toBeNull();
  });

  it('should delete category on confirm action success', fakeAsync(() => {
    const mockCategory = categoryService.defaultCategories.badgeCategories[0];
    component.deleteCategory(mockCategory);
    if (component.confirmAction) {
      component.confirmAction();
    }
    expect(categoryService.deleteBadgeCategory).toHaveBeenCalledWith('1');
    tick();
    expect(component.confirmModal.close).toHaveBeenCalled();
    expect(toastService.showToast).toHaveBeenCalledWith('Categoría eliminada exitosamente', 'success');
    expect(categoryService.getAllBadgeCategories).toHaveBeenCalledTimes(1);
  }));

  it('noSpecialCharsValidator should return error for dangerous characters', () => {
    const control = { value: 'Test<script>' } as AbstractControl;
    expect(component.noSpecialCharsValidator(control)).toEqual({ invalidContent: true });
  });

  it('noSQLInjectionValidator should return error for SQL keywords', () => {
    const control = { value: 'name SELECT * FROM' } as AbstractControl;
    expect(component.noSQLInjectionValidator(control)).toEqual({ invalidContent: true });
  });

  it('saveCategory should prevent submission if form is invalid and show toast', () => {
    component.categoryForm.get('name')?.setValue('A');
    component.saveCategory();
    expect(component.categoryForm.get('name')?.touched).toBe(true);
    expect(toastService.showToast).toHaveBeenCalledWith('Formulario inválido. Revisa los campos.', 'error');
    expect(categoryService.createBadgeCategory).not.toHaveBeenCalled();
  });
});