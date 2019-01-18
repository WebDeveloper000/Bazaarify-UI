import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatsDialogComponent } from './chats-dialog.component';

describe('ChatsDialogComponent', () => {
  let component: ChatsDialogComponent;
  let fixture: ComponentFixture<ChatsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChatsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
