import { TestBed, inject } from '@angular/core/testing';

import { CryptoPaymentsService } from './crypto-payments.service';

describe('CryptoPaymentsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CryptoPaymentsService]
    });
  });

  it('should be created', inject([CryptoPaymentsService], (service: CryptoPaymentsService) => {
    expect(service).toBeTruthy();
  }));
});
