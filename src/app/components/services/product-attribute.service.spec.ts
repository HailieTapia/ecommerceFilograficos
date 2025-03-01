import { TestBed } from '@angular/core/testing';

import { ProductAttributeService } from './product-attribute.service';

describe('ProductAttributeService', () => {
  let service: ProductAttributeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductAttributeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
