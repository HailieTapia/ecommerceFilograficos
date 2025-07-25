import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCollectionComponent } from './product-collection.component';

describe('ProductCollectionComponent', () => {
  let component: ProductCollectionComponent;
  let fixture: ComponentFixture<ProductCollectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCollectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
