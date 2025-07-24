import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarouselCategoriesComponent } from './carousel-categories.component';

describe('CarouselCategoriesComponent', () => {
  let component: CarouselCategoriesComponent;
  let fixture: ComponentFixture<CarouselCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarouselCategoriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarouselCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
