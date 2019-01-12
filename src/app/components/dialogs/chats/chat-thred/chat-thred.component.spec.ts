import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatThredComponent } from './chat-thred.component';

describe('ChatThredComponent', () => {
  let component: ChatThredComponent;
  let fixture: ComponentFixture<ChatThredComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChatThredComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatThredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
