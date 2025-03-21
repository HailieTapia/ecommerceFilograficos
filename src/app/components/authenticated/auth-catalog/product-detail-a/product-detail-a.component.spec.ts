import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductDetailAComponent } from './product-detail-a.component';

describe('ProductDetailAComponent', () => {
  let component: ProductDetailAComponent;
  let fixture: ComponentFixture<ProductDetailAComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailAComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductDetailAComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
