import { Injectable } from '@angular/core';
import { HttpClient,HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/config';
import { switchMap} from 'rxjs/operators';
import { CsrfService } from './csrf.service';

@Injectable({
  providedIn: 'root'
})
export class AuthProductService {
  private apiUrl = `${environment.baseUrl}/products/auth-catalog`;

  constructor(private csrfService: CsrfService, private http: HttpClient) { }

  //Lista productos con filtros y paginación
  getAllProducts(filters?: any): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        let params = new HttpParams();
        
        if (filters) {
          if (filters.page) params = params.set('page', filters.page.toString());
          if (filters.pageSize) params = params.set('pageSize', filters.pageSize.toString());
          if (filters.sort) params = params.set('sort', filters.sort);
          if (filters.categoryId) params = params.set('categoryId', filters.categoryId.toString());
          if (filters.search) params = params.set('search', filters.search);
          if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
          if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
          if (filters.collaboratorId) params = params.set('collaboratorId', filters.collaboratorId.toString());
        }

        return this.http.get(this.apiUrl, { headers, params, withCredentials: true });
      })
    );
  }
  //Detalles de un producto específico
  getProductById(productId: number): Observable<any> {
    return this.csrfService.getCsrfToken().pipe(
      switchMap(csrfToken => {
        const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
        return this.http.get(`${this.apiUrl}/${productId}`, { headers, withCredentials: true });
      })
    );
  }
}