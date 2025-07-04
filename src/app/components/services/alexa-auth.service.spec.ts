import { TestBed } from '@angular/core/testing';

import { AlexaAuthService } from './alexa-auth.service';

describe('AlexaAuthService', () => {
  let service: AlexaAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlexaAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
