import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotifyAboutTwofactorComponent } from './notify-about-twofactor.component';

describe('NotifyAboutTwofactorComponent', () => {
  let component: NotifyAboutTwofactorComponent;
  let fixture: ComponentFixture<NotifyAboutTwofactorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NotifyAboutTwofactorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotifyAboutTwofactorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
