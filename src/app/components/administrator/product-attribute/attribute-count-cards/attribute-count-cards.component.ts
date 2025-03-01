import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-attribute-count-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attribute-count-cards.component.html',
  styleUrls: ['./attribute-count-cards.component.css']
})
export class AttributeCountCardsComponent {
  @Input() categoryCounts: { categoryId: string; name: string; attributeCount: number }[] = [];
  @Input() selectedCategoryId: string | undefined;
  @Output() categorySelected = new EventEmitter<{ categoryId: string; name: string; attributeCount: number }>();
  
  selectCategory(category: { categoryId: string; name: string; attributeCount: number }): void {
    this.categorySelected.emit(category);
  }
}