import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultationDetailsComponent } from './consultation-details.component';

describe('ConsultationDetailsComponent', () => {
  let component: ConsultationDetailsComponent;
  let fixture: ComponentFixture<ConsultationDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultationDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
