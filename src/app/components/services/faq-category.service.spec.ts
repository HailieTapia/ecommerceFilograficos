import { TestBed } from '@angular/core/testing';

import { FaqCategoryService } from './faq-category.service';

describe('FaqCategoryService', () => {
  let service: FaqCategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FaqCategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
