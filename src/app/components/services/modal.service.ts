import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private showLoginModalSource = new BehaviorSubject<boolean>(false);
  showLoginModal$ = this.showLoginModalSource.asObservable();

  showLoginModal(show: boolean) {
    this.showLoginModalSource.next(show);
  }
}