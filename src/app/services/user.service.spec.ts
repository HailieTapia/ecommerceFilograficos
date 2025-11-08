import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { UserService } from './user.service';
import { CsrfService } from './csrf.service';
import { environment } from '../environments/config';

class MockCsrfService {
  getCsrfToken() { return of('fake-csrf'); }
}

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;
  const api = `${environment.baseUrl}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserService,
        { provide: CsrfService, useClass: MockCsrfService }
      ]
    });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getProfile → GET /users/profile + CSRF', () => {
    const mock = { name: 'Ana', points: 850 };
    service.getProfile().subscribe(res => expect(res).toEqual(mock));

    const req = http.expectOne(`${api}/users/profile`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('x-csrf-token')).toBe('fake-csrf');
    req.flush(mock);
  });

  it('getTopClients → GET /users/top-clients (público)', () => {
    const mock = [{ rank: 1, name: 'Leo', points: 1200 }];
    service.getTopClients().subscribe(res => expect(res).toEqual(mock));

    const req = http.expectOne(`${api}/users/top-clients`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.keys().length).toBe(0);
    req.flush(mock);
  });
});