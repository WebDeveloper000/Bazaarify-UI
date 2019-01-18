import { Component, OnInit } from '@angular/core';
import { ChatsService } from 'app/services/chats/chats.service';
import { Observable } from 'rxjs/Observable';
import { AngularFireDatabase } from 'angularfire2/database';
import { UserService } from 'app/services/user.service';

@Component({
  selector: 'app-chats-panel',
  templateUrl: './chats-panel.component.html',
  styleUrls: ['./chats-panel.component.scss']
})
export class ChatsPanelComponent implements OnInit {
  chats: any;
  unreadChatsCount: number;
  chatsAll: any;
  limitToShow: number;

  constructor(
    private db: AngularFireDatabase,
    private chatsService: ChatsService,
    private userService: UserService
  ) {
    this.unreadChatsCount = 0;
    this.limitToShow = 5;
  }

  ngOnInit() {
    //  TODO remove this
    this.db.list(`Users/${this.userService.userUid}/Stores`).valueChanges().subscribe(data => {
      this.chatsService.getChats().then(data => {
        this.chatsAll = data;
        this.chats = this.chatsAll.slice(0, this.limitToShow);
      });

      // this.chatsService.getUnreadChatsCount().then(data => {
      //   this.unreadChatsCount = data;
      // });
    });
  }

  showMore() {
    this.limitToShow += this.limitToShow;
    this.chats = this.chatsAll.slice(1, this.limitToShow);
  }

  clearUnreadChats() {
    this.chatsService.clearUnreadChats();
  }

  // deleteNotification(notification) {
    // this.notificationsService.deleteNotification(notification);
  // }
}
