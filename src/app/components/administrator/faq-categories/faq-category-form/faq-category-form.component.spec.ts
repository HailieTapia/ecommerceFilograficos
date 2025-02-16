import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaqCategoryFormComponent } from './faq-category-form.component';

describe('FaqCategoryFormComponent', () => {
  let component: FaqCategoryFormComponent;
  let fixture: ComponentFixture<FaqCategoryFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqCategoryFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaqCategoryFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
