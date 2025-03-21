import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CsrfService } from '../services/csrf.service';
import { environment } from '../../environments/config';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private apiUrl = `${environment.baseUrl}/cart`;

    constructor(private csrfService: CsrfService, private http: HttpClient) { }

    //añadir al carro
    addToCart(item: { product_id: number, variant_id: number, quantity: number, customization_option_id?: number }): Observable<any> {
        return this.csrfService.getCsrfToken().pipe(
            switchMap(csrfToken => {
                const headers = new HttpHeaders().set('x-csrf-token', csrfToken);
                return this.http.post(`${this.apiUrl}/add`, item, { headers, withCredentials: true });
            })
        );
    }
}
