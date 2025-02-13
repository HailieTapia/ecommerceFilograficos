import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompanyStateService {
  private companySubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  company$: Observable<any> = this.companySubject.asObservable();

  constructor() {}

  setCompanyInfo(companyInfo: any): void {
    this.companySubject.next(companyInfo);
  }
  getCompanyInfo(): Observable<any> {
    return this.company$;
  }
}
