import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportInquiryComponent } from './support-inquiry.component';

describe('SupportInquiryComponent', () => {
  let component: SupportInquiryComponent;
  let fixture: ComponentFixture<SupportInquiryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportInquiryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupportInquiryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
