import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Review } from '../../../../services/review.service';

@Component({
  selector: 'app-review-image-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review-image-modal.component.html',
  styleUrls: ['./review-image-modal.component.css']
})
export class ReviewImageModalComponent {
  @Input() isOpen: boolean = false;
  @Input() review: Review | null = null;
  @Input() selectedMediaIndex: number = 0; // New input to track selected media
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

  prevMedia() {
    if (this.review && this.selectedMediaIndex > 0) {
      this.selectedMediaIndex--;
    }
  }

  nextMedia() {
    if (this.review && this.review.media && this.selectedMediaIndex < this.review.media.length - 1) {
      this.selectedMediaIndex++;
    }
  }
}