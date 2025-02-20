import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultationRowComponent } from './consultation-row.component';

describe('ConsultationRowComponent', () => {
  let component: ConsultationRowComponent;
  let fixture: ComponentFixture<ConsultationRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultationRowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultationRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
