import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewImageModalComponent } from './review-image-modal.component';

describe('ReviewImageModalComponent', () => {
  let component: ReviewImageModalComponent;
  let fixture: ComponentFixture<ReviewImageModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewImageModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewImageModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
