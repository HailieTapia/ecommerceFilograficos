import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Observable, of } from 'rxjs';

// Importaciones del servicio (necesarias para tipado y acceso a interfaces)
import { BadgeCategoryService, BadgeCategory } from './badge-category.service';
import { CsrfService } from '../services/csrf.service'; // Asegúrate de que la ruta sea correcta
// Nota: No necesitamos importar environment, ya que la URL se construye dentro del servicio
// y solo usamos la constante 'apiUrl' aquí.

// --- Mock para CsrfService ---
// Esto es esencial para que el BadgeCategoryService pueda inyectarse sin errores.
class MockCsrfService {
  getCsrfToken(): Observable<string> {
    // Simula el retorno de un token CSRF
    return of('fake-csrf-token');
  }
}

describe('BadgeCategoryService', () => {
  let service: BadgeCategoryService;
  let httpTestingController: HttpTestingController;

  // Objeto de respuesta simulada para pruebas
  const mockCategory: BadgeCategory = {
    badge_category_id: 1,
    name: 'Coleccionista',
    description: 'Junta 10 insignias',
    is_active: true,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    badges: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      // 1. SOLUCIÓN: Importar el módulo de testing HTTP
      imports: [HttpClientTestingModule], 
      
      providers: [
        BadgeCategoryService,
        // 2. SOLUCIÓN: Proveer el mock para la dependencia CsrfService
        { provide: CsrfService, useClass: MockCsrfService }
      ]
    });

    service = TestBed.inject(BadgeCategoryService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verifica que todas las solicitudes HTTP simuladas hayan sido consumidas.
    httpTestingController.verify();
  });

  // ====================================================================
  // 1. Pruebas de inicialización
  // ====================================================================

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ====================================================================
  // 2. Pruebas para getAllBadgeCategories (con filtros complejos)
  // ====================================================================

  it('should send a GET request with default params (page=1, pageSize=10, active)', () => {
    service.getAllBadgeCategories().subscribe(response => {
      expect(response.categories.length).toBe(1);
    });

    const req = httpTestingController.expectOne(r => 
        r.url.endsWith('/badge-categories/') && r.method === 'GET'
    );
    
    // Verificar parámetros por defecto
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('pageSize')).toBe('10');
    expect(req.request.params.get('statusFilter')).toBe('active');
    expect(req.request.headers.get('x-csrf-token')).toBe('fake-csrf-token');

    req.flush({ message: 'Success', categories: [mockCategory], total: 1 });
  });

  it('should send a GET request with all optional filters (search, sort, badgeNameFilter)', () => {
    const testParams = {
      page: 2, 
      pageSize: 5, 
      search: 'TestSearch', 
      statusFilter: 'inactive' as const, // Cambiado el filtro para prueba
      sort: 'name:DESC', 
      badgeNameFilter: 'Comprador' 
    };

    service.getAllBadgeCategories(
      testParams.page,
      testParams.pageSize,
      testParams.search,
      testParams.statusFilter,
      testParams.sort,
      testParams.badgeNameFilter
    ).subscribe();

    const req = httpTestingController.expectOne(r => 
        r.url.endsWith('/badge-categories/') && r.method === 'GET'
    );
    
    // Verificar todos los parámetros opcionales
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('pageSize')).toBe('5');
    expect(req.request.params.get('search')).toBe('TestSearch');
    expect(req.request.params.get('statusFilter')).toBe('inactive');
    expect(req.request.params.get('sort')).toBe('name:DESC');
    expect(req.request.params.get('badgeName')).toBe('Comprador');

    req.flush({ message: 'Success', categories: [], total: 0 });
  });

  // ====================================================================
  // 3. Pruebas para getBadgeDistributionReport
  // ====================================================================

  it('should send GET request to the correct endpoint for the distribution report', () => {
    const mockReport = [
      { category_id: 1, category_name: 'Compras', total_badges: 50 },
      { category_id: 2, category_name: 'Actividad', total_badges: 30 },
    ];
    
    service.getBadgeDistributionReport().subscribe(response => {
      expect(response.report.length).toBe(2);
      expect(response.report[0].total_badges).toBe(50);
    });

    const req = httpTestingController.expectOne(r => 
        r.url.endsWith('/badge-categories/report/distribution')
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('x-csrf-token')).toBe('fake-csrf-token');
    
    req.flush({ message: 'Report generated', report: mockReport });
  });

  // ====================================================================
  // 4. Pruebas CRUD
  // ====================================================================

  it('should call GET by ID', () => {
    const testId = '5';
    service.getBadgeCategoryById(testId).subscribe(response => {
      expect(response.badge_category_id).toBe(1);
    });

    const req = httpTestingController.expectOne(r => r.url.endsWith(`/badge-categories/${testId}`));
    expect(req.request.method).toBe('GET');
    req.flush(mockCategory);
  });

  it('should call POST for createBadgeCategory with correct body', () => {
    const newData = { name: 'Nueva Cat', description: 'Descripción de prueba' };
    service.createBadgeCategory(newData).subscribe(response => {
      expect(response.message).toBe('Category created successfully');
    });

    const req = httpTestingController.expectOne(r => r.url.endsWith('/badge-categories/'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newData);

    req.flush({ message: 'Category created successfully' });
  });

  it('should call PUT for updateBadgeCategory', () => {
    const testId = '1';
    const updateData = { name: 'Cat Actualizada' };
    service.updateBadgeCategory(testId, updateData).subscribe(response => {
      expect(response.message).toBe('Category updated');
    });

    const req = httpTestingController.expectOne(r => r.url.endsWith(`/badge-categories/${testId}`));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateData);

    req.flush({ message: 'Category updated' });
  });
  
  it('should call DELETE for deleteBadgeCategory', () => {
    const testId = '3';
    service.deleteBadgeCategory(testId).subscribe(response => {
      expect(response.message).toBe('Category deleted successfully');
    });

    const req = httpTestingController.expectOne(r => r.url.endsWith(`/badge-categories/${testId}`));
    expect(req.request.method).toBe('DELETE');

    req.flush({ message: 'Category deleted successfully' });
  });
});