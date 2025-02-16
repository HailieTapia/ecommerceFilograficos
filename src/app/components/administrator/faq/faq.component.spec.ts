import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaqComponentAdmin } from './faq.component';

describe('FaqComponent', () => {
  let component: FaqComponentAdmin;
  let fixture: ComponentFixture<FaqComponentAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqComponentAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaqComponentAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
