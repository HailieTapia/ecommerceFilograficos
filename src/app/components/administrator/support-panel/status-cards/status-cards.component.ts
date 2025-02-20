import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 bg-white rounded-lg shadow">
      <div class="flex items-center gap-4">
        <div [class]="iconContainerClass">
          <i [class]="iconClass"></i>
        </div>
        <div>
          <h3 class="text-sm font-medium text-gray-600">{{ title }}</h3>
          <p class="text-2xl font-bold mt-1">{{ count }}</p>
        </div>
      </div>
    </div>
  `
})
export class StatusCardsComponent {
  @Input() iconContainerClass!: string;
  @Input() iconClass!: string;
  @Input() title!: string;
  @Input() count!: number;
}