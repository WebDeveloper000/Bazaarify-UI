import { Component, OnInit, Output, Input, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { UserService } from 'app/services/user.service';
import { Router, Routes } from '@angular/router';
import { NotifyService } from 'app/services/notify/notify.service';
import * as firebase from 'firebase';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { MatDialog } from '@angular/material';
import { HelpComponent } from 'app/components/dialogs/help/help.component';
import { NotificationsDialogComponent } from 'app/components/dialogs/notifications-dialog/notifications-dialog.component';
import 'rxjs/add/observable/forkJoin';
import { NotificationsService } from 'app/services/notifications/notifications.service';
import { ChatsService } from 'app/services/chats/chats.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit {
  unreadNotificationsCount: any;
  unreadChatsCount: any;
  user: any;
  userAuthed: boolean;
  notifications: {}[];

  @Input() chatsDialogState;
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;


  constructor(
    private notificationsService: NotificationsService,
    private chatsService: ChatsService,
    private db: AngularFireDatabase,
    public dialog: MatDialog, private notify: NotifyService, private userService: UserService, private router: Router) {

      this.userService.user.subscribe(user => {
        this.user = user;
        this.userAuthed = user ? true : false;
      });

  }

  logout() {
    this.userService.logout()
      .then(res => {
        this.notify.success(res);
        this.router.navigate(['/login']);
      })
      .catch(err => {
        this.notify.error(err);
      })
  }

  openNotificationsDialog() {
    this.notificationsService.openNotificationsDialog();
  }

  openChatsDialog() {
    this.chatsService.openChatsDialog();
  }

  openHelpDialog() {
    let dialogRef = this.dialog.open(HelpComponent, {
      width: '600px',
      data: {placement: 'header'}
    });
  }

  ngOnInit() {
      this.notificationsService.getUnreadNotificationsCount().subscribe(data => {
        this.unreadNotificationsCount = data;
      });

      this.chatsService.getUnreadMessagesCount().subscribe(data => {
        this.unreadChatsCount = data;
      });
  }

}
