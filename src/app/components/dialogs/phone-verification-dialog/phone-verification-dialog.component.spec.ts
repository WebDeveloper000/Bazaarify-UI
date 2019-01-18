import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoneVerificationDialogComponent } from './phone-verification-dialog.component';

describe('PhoneVerificationDialogComponent', () => {
  let component: PhoneVerificationDialogComponent;
  let fixture: ComponentFixture<PhoneVerificationDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PhoneVerificationDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PhoneVerificationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
