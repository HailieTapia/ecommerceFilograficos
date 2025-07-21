import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalService } from '../../services/modal.service';
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
    // Show the login modal
    this.modalService.showLoginModal(true);

    // Subscribe to ModalService to detect when the modal is closed
    this.modalSubscription = this.modalService.showLoginModal$.subscribe(show => {
      if (!show) {
        // When modal is closed, redirect to home
        this.router.navigate(['/']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.modalSubscription) {
      this.modalSubscription.unsubscribe();
    }
  }
}