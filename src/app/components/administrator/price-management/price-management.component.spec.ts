import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceManagementComponent } from './price-management.component';

describe('PriceManagementComponent', () => {
  let component: PriceManagementComponent;
  let fixture: ComponentFixture<PriceManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PriceManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
