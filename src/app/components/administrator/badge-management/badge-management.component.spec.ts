import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { BadgeManagementComponent } from './badge-management.component';
import { BadgeService, Badge } from '../../../services/badge.service';
import { BadgeCategoryService, BadgeCategory } from '../../../services/badge-category.service';
import { ToastService } from '../../../services/toastService';
import { FormBuilder, AbstractControl, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { of, Subject, throwError } from 'rxjs';
import { EventEmitter, Component, Input, Output, NO_ERRORS_SCHEMA } from '@angular/core';
import { expect } from '@jest/globals';

// --- MOCKS y STUBS ---

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

// Stub para BadgeHistoryComponent
@Component({
  selector: 'app-badge-history',
  template: ''
})
class BadgeHistoryStubComponent {
}

// Mock de Datos
const mockBadges: Badge[] = [
  { 
    badge_id: 1, 
    name: 'Comprador Estrella', 
    description: 'Logro de prueba 1', 
    icon_url: 'url1.png', 
    public_id: 'badge_icon_public_id_123', 
    is_active: true, 
    created_at: '2024-01-01', 
    updated_at: '2024-01-01', 
    badge_category_id: 1, 
    category_name: 'Compra' 
  },
];
const mockCategories: BadgeCategory[] = [
  { badge_category_id: 1, name: 'Compra', description: 'Logros de compra', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01', badges: [] },
  { badge_category_id: 2, name: 'General', description: 'Logros generales', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01', badges: [] },
];

// Mock para BadgeService
class MockBadgeService {
  defaultBadges = {
    badges: mockBadges,
    total: 1,
    page: 1,
    pageSize: 10,
  };
  getAllBadges = jest.fn().mockReturnValue(of(this.defaultBadges));
  getBadgeById = jest.fn().mockReturnValue(of({ badge: mockBadges[0] }));
  createBadge = jest.fn().mockReturnValue(of({ message: 'Creada' }));
  updateBadge = jest.fn().mockReturnValue(of({ message: 'Actualizada' }));
  deleteBadge = jest.fn().mockReturnValue(of({ message: 'Eliminada' }));
}

// Mock para BadgeCategoryService
class MockBadgeCategoryService {
  defaultCategories = {
    badgeCategories: mockCategories,
    total: 2,
    page: 1,
    pageSize: 100,
  };
  getAllBadgeCategories = jest.fn().mockReturnValue(of(this.defaultCategories));
}

// Mock para ToastService
class MockToastService {
  showToast = jest.fn();
}

// --- SUITE DE PRUEBAS ---
describe('BadgeManagementComponent', () => {
  let component: BadgeManagementComponent;
  let fixture: ComponentFixture<BadgeManagementComponent>;
  let badgeService: MockBadgeService;
  let categoryService: MockBadgeCategoryService;
  let toastService: MockToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeManagementComponent],
      declarations: [ModalStubComponent, BadgeHistoryStubComponent],
      providers: [
        FormBuilder,
        DatePipe,
        { provide: BadgeService, useClass: MockBadgeService },
        { provide: BadgeCategoryService, useClass: MockBadgeCategoryService },
        { provide: ToastService, useClass: MockToastService },
        { provide: 'LOCALE_ID', useValue: 'es' }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeManagementComponent);
    component = fixture.componentInstance;
    badgeService = TestBed.inject(BadgeService) as unknown as MockBadgeService;
    categoryService = TestBed.inject(BadgeCategoryService) as unknown as MockBadgeCategoryService;
    toastService = TestBed.inject(ToastService) as unknown as MockToastService;

    // Asignar instancias de ModalStubComponent a los ViewChild
    component.createEditModal = new ModalStubComponent() as any;
    component.confirmModal = new ModalStubComponent() as any;
  });

  it('should create and load data on init', () => {
    const loadBadgesSpy = jest.spyOn(component, 'loadBadges');
    const loadCategoriesSpy = jest.spyOn(component, 'loadBadgeCategories');

    fixture.detectChanges(); // Ejecuta ngOnInit

    expect(component).toBeTruthy();
    expect(loadBadgesSpy).toHaveBeenCalled();
    expect(loadCategoriesSpy).toHaveBeenCalled();
    expect(component.badges.length).toBe(1);
    expect(component.badgeCategories.length).toBe(2);
  });

  // --- PRUEBAS DE TABULACIÓN ---
  it('should switch to history tab and not call loadBadges', () => {
    const loadBadgesSpy = jest.spyOn(component, 'loadBadges');
    loadBadgesSpy.mockClear();
    
    component.setActiveTab('history');

    expect(component.activeTab).toBe('history');
    expect(loadBadgesSpy).not.toHaveBeenCalled();
  });

  it('should switch to management tab and call loadBadges', () => {
    const loadBadgesSpy = jest.spyOn(component, 'loadBadges');
    loadBadgesSpy.mockClear();

    component.setActiveTab('history');
    component.setActiveTab('management');

    expect(component.activeTab).toBe('management');
    expect(loadBadgesSpy).toHaveBeenCalled();
  });

  // --- PRUEBAS DE CARGA Y PAGINACIÓN ---
  it('should call loadBadges with correct page and itemsPerPage change', () => {
    const loadSpy = jest.spyOn(component, 'loadBadges');
    loadSpy.mockClear();

    component.itemsPerPage = 20;
    component.onItemsPerPageChange();
    
    expect(component.currentPage).toBe(1);
    expect(loadSpy).toHaveBeenCalled();
    expect(badgeService.getAllBadges).toHaveBeenCalledWith(1, 20, '', 'active');

    loadSpy.mockClear();
    component.onPageChange(2);
    expect(component.currentPage).toBe(2);
    expect(loadSpy).toHaveBeenCalled();
    expect(badgeService.getAllBadges).toHaveBeenCalledWith(2, 20, '', 'active');
  });

  it('should update filters and call loadBadges', () => {
    const loadSpy = jest.spyOn(component, 'loadBadges');
    loadSpy.mockClear();

    component.statusFilter = 'inactive';
    component.onStatusFilterChange();
    
    expect(component.currentPage).toBe(1);
    expect(loadSpy).toHaveBeenCalled();
    expect(badgeService.getAllBadges).toHaveBeenCalledWith(1, 10, '', 'inactive');
  });

  it('should handle error when loading badges', () => {
    badgeService.getAllBadges.mockReturnValue(throwError(() => ({ error: { message: 'Error de carga' } })));
    
    component.loadBadges();

    expect(toastService.showToast).toHaveBeenCalledWith('Error de carga', 'error');
    expect(component.isLoading).toBe(false);
  });

  // --- PRUEBAS DE DEBOUNCE (SEARCH) ---
it('should debounce search term and call loadBadges once', fakeAsync(() => {
  // Espía y llamada inicial (si la hay)
  const loadSpy = jest.spyOn(component, 'loadBadges');
  fixture.detectChanges(); // Ejecuta ngOnInit y la primera loadBadges
  loadSpy.mockClear(); // Limpiar la llamada inicial de loadBadges

  // Primer cambio: Inicia el debounce (debe pasar el término al Subject)
  component.searchTerm = 't';
  component.onSearchChange();
  tick(100); // 100ms: No debería llamarse
  expect(loadSpy).not.toHaveBeenCalled();

  // Segundo cambio: Reinicia el debounce
  component.searchTerm = 'te';
  component.onSearchChange();
  tick(250); // 100 + 250 = 350ms desde el inicio del 1er, pero 250ms desde el 2do.
  expect(loadSpy).not.toHaveBeenCalled();

  // Tercer cambio, con el término final
  component.searchTerm = 'test';
  component.onSearchChange();
  tick(100); // 350 + 100 = 450. No debería llamarse
  expect(loadSpy).not.toHaveBeenCalled();

  // Espera a que se cumplan los 300ms del último cambio
  tick(200); // 450 + 200 = 650. Ahora se llama.

  // La primera tick después del debounce (300ms) es la que dispara el observable.
  expect(loadSpy).toHaveBeenCalledTimes(1);
  expect(component.currentPage).toBe(1);

  // Llama a loadBadges con el último término de búsqueda
  expect(badgeService.getAllBadges).toHaveBeenCalledWith(1, 10, 'test', 'active');

  flush(); // Finalizar cualquier operación pendiente
}));

  // --- PRUEBAS DE CRUD: CREATE/EDIT ---
  it('should open create modal and reset form/validators', () => {
    component.openCreateModal();
    
    expect(component.selectedBadgeId).toBeNull();
    expect(component.badgeForm.get('name')?.value).toBeNull();
    expect(component.badgeForm.get('badgeIcon')?.hasValidator(Validators.required)).toBe(true);
    expect(component.createEditModal.open).toHaveBeenCalled();
  });

  it('should open edit modal and patch values, removing icon validator', fakeAsync(() => {
    const mockBadge = mockBadges[0];
    component.openEditModal(mockBadge);
    
    expect(badgeService.getBadgeById).toHaveBeenCalledWith('1');
    tick();

    expect(component.selectedBadgeId).toBe('1');
    expect(component.badgeForm.get('name')?.value).toBe(mockBadge.name);
    expect(component.badgeForm.get('badgeIcon')?.hasValidator(Validators.required)).toBe(false);
    expect(component.createEditModal.open).toHaveBeenCalled();
  }));

  it('should call createBadge on save if selectedBadgeId is null', fakeAsync(() => {
    component.openCreateModal();
    component.selectedFile = new File([''], 'test.png', { type: 'image/png' });
    component.badgeForm.patchValue({ 
      name: 'New Badge', 
      description: 'New Desc', 
      badge_category_id: 1,
      badgeIcon: 'selected' 
    });
    
    component.saveBadge();
    
    expect(badgeService.createBadge).toHaveBeenCalledWith({ name: 'New Badge', description: 'New Desc', badge_category_id: 1 }, component.selectedFile);
    expect(badgeService.updateBadge).not.toHaveBeenCalled();
    tick();
    
    expect(toastService.showToast).toHaveBeenCalledWith('Insignia creada exitosamente', 'success');
    expect(component.createEditModal.close).toHaveBeenCalled();
  }));

  it('should call updateBadge on save if selectedBadgeId is set', fakeAsync(() => {
    component.openEditModal(mockBadges[0]);
    flush(); // Resolver getBadgeById

    component.badgeForm.get('name')?.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(100)]);
    component.badgeForm.get('description')?.setValidators([Validators.maxLength(500)]);
    component.badgeForm.get('badge_category_id')?.setValidators([Validators.required, Validators.min(1)]);
    component.badgeForm.patchValue({ 
      name: 'Updated Badge', 
      description: 'Logro de prueba 1', 
      badge_category_id: 1 
    });
    component.badgeForm.updateValueAndValidity();
    component.selectedFile = new File([''], 'update.jpg', { type: 'image/jpg' });

    component.saveBadge();
    flush(); // Resolver updateBadge

    expect(badgeService.updateBadge).toHaveBeenCalledWith('1', { name: 'd Badge', description: 'Logro de prueba 1', badge_category_id: 1 }, component.selectedFile);
    expect(toastService.showToast).toHaveBeenCalledWith('Insignia actualizada exitosamente', 'success');
    expect(component.createEditModal.close).toHaveBeenCalled();
  }));

  it('should prevent submission if form is invalid and show toast', () => {
    component.openCreateModal();
    component.badgeForm.get('name')?.setValue('A');
    
    component.saveBadge();
    
    expect(toastService.showToast).toHaveBeenCalledWith('Formulario inválido. Revisa los campos.', 'error');
    expect(badgeService.createBadge).not.toHaveBeenCalled();
  });

  // --- PRUEBAS DE CRUD: DELETE (Confirmación) ---
  it('should open confirmation modal before deleting a badge', () => {
    const mockBadge = mockBadges[0];
    component.deleteBadge(mockBadge);
    
    expect(component.confirmModal.open).toHaveBeenCalled();
    expect(component.confirmModalTitle).toContain('Eliminar Insignia');
    expect(component.confirmAction).not.toBeNull();
  });

  it('should delete badge on confirm action success', fakeAsync(() => {
    jest.spyOn(component, 'ngOnInit').mockImplementation(() => {});
    badgeService.getAllBadges.mockClear();
    
    const mockBadge = mockBadges[0];
    component.deleteBadge(mockBadge);
    
    if (component.confirmAction) {
      component.handleConfirm();
    }
    
    expect(badgeService.deleteBadge).toHaveBeenCalledWith('1');
    flush();

    expect(component.confirmModal.close).toHaveBeenCalled();
    expect(toastService.showToast).toHaveBeenCalledWith('Insignia eliminada exitosamente', 'success');
    expect(badgeService.getAllBadges).toHaveBeenCalledTimes(1);
  }));

  it('should handle delete badge error', fakeAsync(() => {
    const mockBadge = mockBadges[0];
    badgeService.deleteBadge.mockReturnValue(throwError(() => ({ error: { message: 'Error al borrar' } })));

    component.deleteBadge(mockBadge);
    
    if (component.confirmAction) {
      component.handleConfirm();
    }
    
    tick();
    
    expect(toastService.showToast).toHaveBeenCalledWith('Error al borrar', 'error');
    expect(component.confirmModal.close).toHaveBeenCalled();
  }));

  // --- PRUEBAS DE VALIDACIÓN DE ARCHIVOS ---
  it('should validate file selection (size and type)', () => {
    const validFile = new File([''], 'valid.png', { type: 'image/png' });
    Object.defineProperty(validFile, 'size', { value: 100 * 1024 }); 
    const validEvent = { target: { files: [validFile] } } as unknown as Event;

    jest.spyOn(window, 'FileReader').mockImplementation(function (this: any) {
      this.readAsDataURL = jest.fn().mockImplementation(() => {
        this.result = 'data:image/png;base64,...';
        if (this.onload) this.onload();
      });
      return this;
    } as any);

    component.onFileSelected(validEvent);
    expect(component.selectedFile).toBe(validFile);
    expect(component.imagePreview).not.toBeNull();
    expect(component.badgeForm.get('badgeIcon')?.value).toBe('selected');

    const largeFile = new File([''], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 2 * 1024 * 1024 }); 
    const largeEvent = { target: { files: [largeFile] } } as unknown as Event;

    component.onFileSelected(largeEvent);
    expect(component.selectedFile).toBeNull();
    expect(toastService.showToast).toHaveBeenCalledWith('El archivo no puede exceder 1MB', 'error');

    const invalidTypeFile = new File([''], 'invalid.pdf', { type: 'application/pdf' });
    const invalidTypeEvent = { target: { files: [invalidTypeFile] } } as unknown as Event;

    component.onFileSelected(invalidTypeEvent);
    expect(component.selectedFile).toBeNull();
    expect(toastService.showToast).toHaveBeenCalledWith('Solo se permiten archivos JPG, JPEG, PNG o WEBP', 'error');
  });
});