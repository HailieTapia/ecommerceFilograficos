import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkPriceUpdateComponent } from './bulk-price-update.component';

describe('BulkPriceUpdateComponent', () => {
  let component: BulkPriceUpdateComponent;
  let fixture: ComponentFixture<BulkPriceUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkPriceUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BulkPriceUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
