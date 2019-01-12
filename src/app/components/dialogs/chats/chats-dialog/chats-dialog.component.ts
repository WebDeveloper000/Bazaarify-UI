import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild, Input, Output } from '@angular/core';
import { ChatsService } from '../../../../services/chats/chats.service';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-chats-dialog',
  templateUrl: 'chats-dialog.component.html',
  styleUrls: ['chats-dialog.component.scss']
})
export class ChatsDialogComponent implements OnInit {
  chats: any;
  unreadChatsCount: number;
  chatsAll: any;
  limitToShow: number;
  backdropWasClicked: Boolean;
  isChatsDialogVisible: Boolean;
  showSpinner: Boolean = false;

  constructor(
    private chatsService: ChatsService,
  ) {
    this.showSpinner = true;

    this.backdropWasClicked = false;

    document.addEventListener('openChatsDialog', () => {
      this.isChatsDialogVisible = true;
    }, false);

    document.addEventListener('closeChatsDialog', () => {
      this.isChatsDialogVisible = false;
    }, false);

    chatsService.getChats().subscribe(data => {
      this.chats = data;

      this.showSpinner = false;
    });
  }

  openThread(storeId, peerId) {
    this.chatsService.closeChatsDialog();
    this.chatsService.openThreadDialog(storeId, peerId);
  }

  ngOnInit() {
  }

  /**
   * Backdrop was clicked while chatsDialog is active
   */
  onBackdropClicked(event) {
    this.isChatsDialogVisible = false;
  }

}
