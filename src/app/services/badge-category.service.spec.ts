import { TestBed } from '@angular/core/testing';

import { BadgeCategoryService } from './badge-category.service';

describe('BadgeCategoryService', () => {
  let service: BadgeCategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BadgeCategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
