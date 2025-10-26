import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private onlineStatus = new BehaviorSubject<boolean>(navigator.onLine);
  public status$ = this.onlineStatus.asObservable(); // Añadir 'public' explícitamente

  constructor() {
    fromEvent(window, 'online').subscribe(() => this.onlineStatus.next(true));
    fromEvent(window, 'offline').subscribe(() => this.onlineStatus.next(false));
  }
} 