import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaqCategoriesComponent } from './faq-categories.component';

describe('FaqCategoriesComponent', () => {
  let component: FaqCategoriesComponent;
  let fixture: ComponentFixture<FaqCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqCategoriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaqCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
