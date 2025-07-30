import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalService } from '../../../services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login-redirect',
  template: '', // No content needed, as it only triggers the modal
})
export class LoginRedirectComponent implements OnInit, OnDestroy {
  private modalSubscription!: Subscription;

  constructor(
    private modalService: ModalService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const currentUrl = this.router.url;
    if (currentUrl.startsWith('/login')) {
      this.modalService.showLoginModal(true);
    } else if (currentUrl.startsWith('/register')) {
      this.modalService.showRegisterModal(true);
    }

    // Suscribirse a los modales para detectar cuando se cierran
    this.modalSubscription = this.modalService.showLoginModal$.subscribe(show => {
      if (!show && currentUrl.startsWith('/login')) {
        this.router.navigate(['/']);
      }
    });

    this.modalSubscription.add(
      this.modalService.showRegisterModal$.subscribe(show => {
        if (!show && currentUrl.startsWith('/register')) {
          this.router.navigate(['/']);
        }
      })
    );
  }

  ngOnDestroy(): void {
    if (this.modalSubscription) {
      this.modalSubscription.unsubscribe();
    }
  }
}