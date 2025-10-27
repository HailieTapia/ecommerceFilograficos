import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Observable, of } from 'rxjs';

import { BadgeCategoryService, BadgeCategory } from './badge-category.service';
import { BadgeService, Badge } from './badge.service';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../environments/config';

// Mock para CsrfService
class MockCsrfService {
  getCsrfToken(): Observable<string> {
    return of('fake-csrf-token');
  }
}

describe('BadgeCategoryService', () => {
  let badgeCategoryService: BadgeCategoryService;
  let badgeService: BadgeService;
  let httpTestingController: HttpTestingController;
  const apiUrl = `${environment.baseUrl}/badge-categories`;
  const badgeApiUrl = `${environment.baseUrl}/badges`;
  const mockCategory: BadgeCategory = {
    badge_category_id: 1,
    name: 'Coleccionista',
    description: 'Junta 10 insignias',
    is_active: true,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    badges: [], // Incluido para compatibilidad con la verificación
  };
  const mockBadge: Badge = {
    badge_id: 1,
    public_id: 'badge-001',
    name: 'Insignia Coleccionista',
    icon_url: 'icon.png',
    is_active: true,
    badge_category_id: 1,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BadgeCategoryService,
        BadgeService,
        { provide: CsrfService, useClass: MockCsrfService },
      ],
    });

    badgeCategoryService = TestBed.inject(BadgeCategoryService);
    badgeService = TestBed.inject(BadgeService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(badgeCategoryService).toBeTruthy();
  });

  it('should send a GET request with default pagination and active filter', () => {
    badgeCategoryService.getAllBadgeCategories().subscribe(response => {
      expect(response.categories.length).toBe(1);
      expect(response.total).toBe(1);
    });

    const req = httpTestingController.expectOne(r => 
      r.url === `${apiUrl}/` && r.method === 'GET'
    );
    
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('pageSize')).toBe('10');
    expect(req.request.params.get('statusFilter')).toBe('active');
    expect(req.request.headers.get('x-csrf-token')).toBe('fake-csrf-token');

    req.flush({ message: 'Success', categories: [mockCategory], total: 1 });
  });

  it('should send a GET request with all optional filters and sorting', () => {
    const testParams = {
      page: 2,
      pageSize: 5,
      search: 'TestSearch',
      statusFilter: 'all' as const,
      sort: 'name:ASC',
      badgeNameFilter: 'Premium',
    };

    badgeCategoryService.getAllBadgeCategories(
      testParams.page,
      testParams.pageSize,
      testParams.search,
      testParams.statusFilter,
      testParams.sort,
      testParams.badgeNameFilter
    ).subscribe();

    const req = httpTestingController.expectOne(r => 
      r.url === `${apiUrl}/` && r.method === 'GET'
    );
    
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('pageSize')).toBe('5');
    expect(req.request.params.get('search')).toBe('TestSearch');
    expect(req.request.params.get('statusFilter')).toBe('all');
    expect(req.request.params.get('sort')).toBe('name:ASC');
    expect(req.request.params.get('badgeName')).toBe('Premium');

    req.flush({ message: 'Success', categories: [], total: 0 });
  });

  it('should send GET request for badge distribution report', () => {
    const mockReport = [
      { category_id: 1, category_name: 'Compras', total_badges: 5 },
      { category_id: 2, category_name: 'Actividad', total_badges: 3 },
    ];
    
    badgeCategoryService.getBadgeDistributionReport().subscribe(response => {
      expect(response.message).toBe('Report generated');
      expect(response.report.length).toBe(2);
      expect(response.report[0].category_name).toBe('Compras');
    });

    const req = httpTestingController.expectOne(`${apiUrl}/report/distribution`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('x-csrf-token')).toBe('fake-csrf-token');
    
    req.flush({ message: 'Report generated', report: mockReport });
  });

  it('should call GET by ID with the correct URL', () => {
    const testId = '10';
    badgeCategoryService.getBadgeCategoryById(testId).subscribe(response => {
      expect(response).toEqual(mockCategory);
    });

    const req = httpTestingController.expectOne(`${apiUrl}/${testId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCategory);
  });

  it('should call POST for createBadgeCategory', () => {
    const newData = { name: 'Nueva Cat', description: 'Desc' };
    badgeCategoryService.createBadgeCategory(newData).subscribe(response => {
      expect(response.message).toBe('Category created');
    });

    const req = httpTestingController.expectOne(`${apiUrl}/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newData);
    expect(req.request.headers.get('x-csrf-token')).toBe('fake-csrf-token');

    req.flush({ message: 'Category created' });
  });

  it('should call PUT for updateBadgeCategory', () => {
    const testId = '1';
    const updateData = { description: 'Updated Desc' };
    badgeCategoryService.updateBadgeCategory(testId, updateData).subscribe(response => {
      expect(response.message).toBe('Category updated');
    });

    const req = httpTestingController.expectOne(`${apiUrl}/${testId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateData);

    req.flush({ message: 'Category updated' });
  });
  
  it('should call DELETE for deleteBadgeCategory', () => {
    const testId = '1';
    badgeCategoryService.deleteBadgeCategory(testId).subscribe(response => {
      expect(response.message).toBe('Category deleted');
    });

    const req = httpTestingController.expectOne(`${apiUrl}/${testId}`);
    expect(req.request.method).toBe('DELETE');

    req.flush({ message: 'Category deleted' });
  });

  it('should create a badge linked to a category', () => {
    const newCategory = { name: 'TestCat', description: 'Test Description' };
    const newBadge = {
      name: 'TestBadge',
      description: 'Test Badge Description',
      badge_category_id: 1,
    };
    const mockFile = new File([''], 'test-icon.png', { type: 'image/png' }); // Simular archivo

    // Crear categoría
    badgeCategoryService.createBadgeCategory(newCategory).subscribe(response => {
      expect(response.message).toBe('Category created');
    });

    let req = httpTestingController.expectOne(`${apiUrl}/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newCategory);
    req.flush({ message: 'Category created', badge_category_id: 1 });

    // Crear insignia asociada
    badgeService.createBadge(newBadge, mockFile).subscribe(response => {
      expect(response.message).toBe('Badge created');
      expect(response.badge.badge_category_id).toBe(1);
      expect(response.badge.name).toBe('TestBadge');
    });

    req = httpTestingController.expectOne(`${badgeApiUrl}/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.get('name')).toBe(newBadge.name);
    expect(req.request.body.get('description')).toBe(newBadge.description);
    expect(req.request.body.get('badge_category_id')).toBe('1');
    expect(req.request.body.get('badgeIcon')).toEqual(mockFile);
    expect(req.request.headers.get('x-csrf-token')).toBe('fake-csrf-token');
    req.flush({ message: 'Badge created', badge: { ...mockBadge, name: newBadge.name, description: newBadge.description, badge_category_id: 1 } });

    // Verificar que la categoría ahora incluye la insignia
    badgeCategoryService.getBadgeCategoryById('1').subscribe(response => {
      expect(response.badges.length).toBe(1);
      expect(response.badges[0].name).toBe('TestBadge');
    });

    req = httpTestingController.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ ...mockCategory, badges: [{ ...mockBadge, name: newBadge.name, description: newBadge.description, badge_category_id: 1 }] });
  });
});