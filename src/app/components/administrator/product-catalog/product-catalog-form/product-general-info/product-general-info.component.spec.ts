import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductGeneralInfoComponent } from './product-general-info.component';

describe('ProductGeneralInfoComponent', () => {
  let component: ProductGeneralInfoComponent;
  let fixture: ComponentFixture<ProductGeneralInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductGeneralInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductGeneralInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
