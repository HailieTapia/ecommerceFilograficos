import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttributeCountCardsComponent } from './attribute-count-cards.component';

describe('AttributeCountCardsComponent', () => {
  let component: AttributeCountCardsComponent;
  let fixture: ComponentFixture<AttributeCountCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttributeCountCardsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttributeCountCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
