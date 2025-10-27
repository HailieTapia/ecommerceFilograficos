import { render, screen, fireEvent, within } from '@testing-library/angular';
import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { BadgeManagementComponent } from './badge-management.component';
import { BadgeService, Badge } from '../../../services/badge.service';
import { BadgeCategoryService, BadgeCategory } from '../../../services/badge-category.service';
import { ToastService } from '../../../services/toastService';
import { FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { of, throwError } from 'rxjs';
import { EventEmitter, Component, Input, Output, NO_ERRORS_SCHEMA } from '@angular/core';
import '@testing-library/jest-dom';

// --- MOCKS y STUBS ---

// Stub para ModalComponent
@Component({
  selector: 'app-modal',
  template: '<ng-content select="[slot=body]"></ng-content><ng-content select="[slot=actions]"></ng-content>',
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
  template: '',
})
class BadgeHistoryStubComponent {}

// Stub para PaginationComponent
@Component({
  selector: 'app-pagination',
  template: '',
})
class PaginationStubComponent {
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;
  @Input() itemsPerPage: number = 10;
  @Output() pageChange = new EventEmitter<number>();
}

// Mock de Datos
const mockBadges: Badge[] = [
  {
    badge_id: 1,
    name: 'Coleccionista I',
    description: 'Obtuvo 5 productos',
    icon_url: 'icon1.png',
    public_id: 'badge_icon_public_id_123',
    is_active: true,
    created_at: '2024-05-15',
    updated_at: '2024-05-15',
    badge_category_id: 1,
    category_name: 'Compra',
  },
  {
    badge_id: 2,
    name: 'Comprador Exprés',
    description: 'Primera compra rápida',
    icon_url: 'icon2.png',
    public_id: 'badge_icon_public_id_456',
    is_active: true,
    created_at: '2024-01-20',
    updated_at: '2024-01-20',
    badge_category_id: 2,
    category_name: 'Velocidad',
  },
];

const mockCategories: BadgeCategory[] = [
  {
    badge_category_id: 1,
    name: 'Compra',
    description: 'Logros de compra',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    badges: [],
  },
  {
    badge_category_id: 2,
    name: 'Velocidad',
    description: 'Logros de velocidad',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    badges: [],
  },
];

// Mock para BadgeService
class MockBadgeService {
  defaultBadges = {
    badges: mockBadges,
    total: 2,
    page: 1,
    pageSize: 10,
  };
  getAllBadges = jest.fn().mockReturnValue(of(this.defaultBadges));
  getBadgeById = jest.fn().mockReturnValue(of({ badge: mockBadges[0] }));
  createBadge = jest.fn().mockReturnValue(of({ message: 'Creada' }));
  updateBadge = jest.fn().mockReturnValue(of({ message: 'Actualizada' }));
  deleteBadge = jest.fn().mockReturnValue(of({ message: 'Eliminada' }));
  getBadgeMetrics = jest.fn().mockReturnValue(of({ metrics: [] }));
  getGrantedBadgesHistory = jest.fn().mockReturnValue(of({ history: [], total: 0, page: 1, pageSize: 10 }));
  getAcquisitionTrend = jest.fn().mockReturnValue(of({ trend: [] }));
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

// Pruebas no UI (usando TestBed directamente)
describe('BadgeManagementComponent (Non-UI Tests)', () => {
  let component: BadgeManagementComponent;
  let fixture: ComponentFixture<BadgeManagementComponent>;
  let badgeService: MockBadgeService;
  let categoryService: MockBadgeCategoryService;
  let toastService: MockToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeManagementComponent],
      declarations: [ModalStubComponent, BadgeHistoryStubComponent, PaginationStubComponent],
      providers: [
        FormBuilder,
        DatePipe,
        { provide: BadgeService, useClass: MockBadgeService },
        { provide: BadgeCategoryService, useClass: MockBadgeCategoryService },
        { provide: ToastService, useClass: MockToastService },
        { provide: 'LOCALE_ID', useValue: 'es' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
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
    expect(component.badges.length).toBe(2);
    expect(component.badgeCategories.length).toBe(2);
  });

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

  it('should debounce search term and call loadBadges once', fakeAsync(() => {
    const loadSpy = jest.spyOn(component, 'loadBadges');
    fixture.detectChanges();
    loadSpy.mockClear();

    component.searchTerm = 't';
    component.onSearchChange();
    tick(100);
    expect(loadSpy).not.toHaveBeenCalled();

    component.searchTerm = 'te';
    component.onSearchChange();
    tick(250);
    expect(loadSpy).not.toHaveBeenCalled();

    component.searchTerm = 'test';
    component.onSearchChange();
    tick(100);
    expect(loadSpy).not.toHaveBeenCalled();

    tick(200);
    expect(loadSpy).toHaveBeenCalledTimes(1);
    expect(component.currentPage).toBe(1);
    expect(badgeService.getAllBadges).toHaveBeenCalledWith(1, 10, 'test', 'active');

    flush();
  }));

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
      badgeIcon: 'selected',
    });

    component.saveBadge();

    expect(badgeService.createBadge).toHaveBeenCalledWith(
      { name: 'New Badge', description: 'New Desc', badge_category_id: 1 },
      component.selectedFile
    );
    expect(badgeService.updateBadge).not.toHaveBeenCalled();
    tick();

    expect(toastService.showToast).toHaveBeenCalledWith('Insignia creada exitosamente', 'success');
    expect(component.createEditModal.close).toHaveBeenCalled();
  }));

  it('should call updateBadge on save if selectedBadgeId is set', fakeAsync(() => {
    component.openEditModal(mockBadges[0]);
    flush();

    component.badgeForm.get('name')?.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(100)]);
    component.badgeForm.get('description')?.setValidators([Validators.maxLength(500)]);
    component.badgeForm.get('badge_category_id')?.setValidators([Validators.required, Validators.min(1)]);
    component.badgeForm.patchValue({
      name: 'Updated Badge',
      description: 'Obtuvo 5 productos',
      badge_category_id: 1,
    });
    component.badgeForm.updateValueAndValidity();
    component.selectedFile = new File([''], 'update.jpg', { type: 'image/jpg' });

    component.saveBadge();
    flush();

    expect(badgeService.updateBadge).toHaveBeenCalledWith('1', expect.anything(), component.selectedFile);
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

// Pruebas UI (usando Angular Testing Library)
describe('BadgeManagementComponent (UI Tests with Angular Testing Library)', () => {
  let badgeService: MockBadgeService;

  beforeEach(() => {
    badgeService = new MockBadgeService();
  });

  const renderComponent = async () => {
    return await render(BadgeManagementComponent, {
      imports: [BadgeManagementComponent],
      declarations: [ModalStubComponent, BadgeHistoryStubComponent, PaginationStubComponent],
      providers: [
        FormBuilder,
        DatePipe,
        { provide: BadgeService, useValue: badgeService },
        { provide: BadgeCategoryService, useClass: MockBadgeCategoryService },
        { provide: ToastService, useClass: MockToastService },
        { provide: 'LOCALE_ID', useValue: 'es' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
  };

  it('should render badges and categories correctly in the UI', async () => {
    await renderComponent();

    // Verificar título principal
    expect(screen.getByText('Gestión de Gamificación')).toBeInTheDocument();

    // Verificar que las insignias "Coleccionista I" y "Comprador Exprés" se renderizan
    expect(screen.getByText('Coleccionista I')).toBeInTheDocument();
    expect(screen.getByText('Comprador Exprés')).toBeInTheDocument();

    // Verificar columnas de la tabla
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Icono')).toBeInTheDocument();
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Descripción')).toBeInTheDocument();
    expect(screen.getByText('Categoría')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
    expect(screen.getByText('Creado')).toBeInTheDocument();
    expect(screen.getByText('Acciones')).toBeInTheDocument();

    // Verificar datos específicos de las insignias
    const badgeRows = screen.getAllByRole('row');
    expect(badgeRows.length).toBeGreaterThanOrEqual(2); // Incluye encabezados

    const firstBadgeRow = within(badgeRows[1]); // La fila 0 es el encabezado
    expect(firstBadgeRow.getByText('1')).toBeInTheDocument();
    expect(firstBadgeRow.getByText('Coleccionista I')).toBeInTheDocument();
    expect(firstBadgeRow.getByText('Obtuvo 5 productos')).toBeInTheDocument();
    expect(firstBadgeRow.getByText('Compra')).toBeInTheDocument();
    expect(firstBadgeRow.getByText('Activa')).toBeInTheDocument();
    expect(firstBadgeRow.getByRole('img', { name: 'Coleccionista I' })).toHaveAttribute('src', 'icon1.png');

    const secondBadgeRow = within(badgeRows[2]);
    expect(secondBadgeRow.getByText('2')).toBeInTheDocument();
    expect(secondBadgeRow.getByText('Comprador Exprés')).toBeInTheDocument();
    expect(secondBadgeRow.getByText('Primera compra rápida')).toBeInTheDocument();
    expect(secondBadgeRow.getByText('Velocidad')).toBeInTheDocument();
    expect(secondBadgeRow.getByText('Activa')).toBeInTheDocument();
    expect(secondBadgeRow.getByRole('img', { name: 'Comprador Exprés' })).toHaveAttribute('src', 'icon2.png');
  });

  it('should handle user interactions like tab switching and modal opening', async () => {
    await renderComponent();

    // Verificar pestaña inicial
    expect(screen.getByRole('tab', { name: 'Gestión de Insignias' })).toHaveClass('text-light-primary');

    // Cambiar a pestaña de historial
    fireEvent.click(screen.getByRole('tab', { name: 'Historial Otorgado' }));
    expect(screen.getByRole('tab', { name: 'Historial Otorgado' })).toHaveClass('text-light-primary');
    
    // Verificar que la TABLA de insignias NO se muestra (no el select del modal)
    const badgeTableRows = screen.queryAllByRole('row', { name: /Coleccionista I/ });
    expect(badgeTableRows).toHaveLength(0); // No hay filas de tabla con ese texto

    // Volver a pestaña de gestión
    fireEvent.click(screen.getByRole('tab', { name: 'Gestión de Insignias' }));
    expect(screen.getByText('Coleccionista I')).toBeInTheDocument();

    // Abrir modal de creación
    const createButton = screen.getByRole('button', { name: 'Crear Insignia' });
    fireEvent.click(createButton);
    expect(screen.getByRole('heading', { name: 'Crear Insignia' })).toBeInTheDocument();

    // Simular edición de una insignia
    const editButton = screen.getAllByRole('button', { name: 'Editar' })[0];
    fireEvent.click(editButton);
    expect(screen.getByRole('heading', { name: 'Editar Insignia' })).toBeInTheDocument();
  });

  it('should display error message when no badges are available', async () => {
    badgeService.getAllBadges.mockReturnValue(of({ badges: [], total: 0, page: 1, pageSize: 10 }));
    await renderComponent();

    expect(screen.getByText('No hay insignias disponibles')).toBeInTheDocument();
  });

  it('should display error messages when form is invalid', async () => {
    await renderComponent();

    // Abrir modal de creación y enviar formulario inválido
    fireEvent.click(screen.getByRole('button', { name: 'Crear Insignia' }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));
    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('La categoría es obligatoria.')).toBeInTheDocument();
    expect(screen.getByText('El icono es obligatorio.')).toBeInTheDocument();
  });

  it('should apply correct Tailwind classes for styling', async () => {
    await renderComponent();

    // Verificar clases Tailwind en el contenedor principal
    const mainContainer = document.querySelector('div.min-h-screen');
    expect(mainContainer).toHaveClass('min-h-screen');
    expect(mainContainer).toHaveClass('bg-gray-50');
    expect(mainContainer).toHaveClass('dark:bg-gray-900');
    expect(mainContainer).toHaveClass('text-gray-900');
    expect(mainContainer).toHaveClass('dark:text-gray-100');

    // Verificar clases en la tabla
    const table = screen.getByRole('table');
    expect(table).toHaveClass('w-full');
    expect(table).toHaveClass('table-auto');
    expect(table).toHaveClass('border-collapse');

    // Verificar clases en el botón de crear
    const createButton = screen.getByRole('button', { name: 'Crear Insignia' });
    expect(createButton).toHaveClass('bg-light-primary');
    expect(createButton).toHaveClass('dark:bg-dark-primary');
    expect(createButton).toHaveClass('text-white');
    expect(createButton).toHaveClass('rounded-md');

    // Verificar clases en el estado de las insignias
    const statusBadges = screen.getAllByText('Activa');
    expect(statusBadges[0]).toHaveClass('bg-green-100');
    expect(statusBadges[0]).toHaveClass('text-green-800');
    expect(statusBadges[0]).toHaveClass('dark:bg-green-900');
    expect(statusBadges[0]).toHaveClass('dark:text-green-300');

    // Verificar clases en el modal
    fireEvent.click(createButton);
    // Selecciona el contenedor del modal correctamente
    const modal = screen.getByRole('dialog').querySelector('.bg-white, .dark\\:bg-gray-800');
    expect(modal).toHaveClass('bg-white');
    expect(modal).toHaveClass('dark:bg-gray-800');
  });
});