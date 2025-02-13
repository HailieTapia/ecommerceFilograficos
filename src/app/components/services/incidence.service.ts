import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/config';
import { CsrfService } from './csrf.service';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IncidenceService {

}
