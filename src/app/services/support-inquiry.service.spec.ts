import { TestBed } from '@angular/core/testing';

import { SupportInquiryService } from './support-inquiry.service';

describe('SupportInquiryService', () => {
  let service: SupportInquiryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SupportInquiryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
