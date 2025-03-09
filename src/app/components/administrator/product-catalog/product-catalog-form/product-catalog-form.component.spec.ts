import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCatalogFormComponent } from './product-catalog-form.component';

describe('ProductCatalogFormComponent', () => {
  let component: ProductCatalogFormComponent;
  let fixture: ComponentFixture<ProductCatalogFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCatalogFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductCatalogFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
