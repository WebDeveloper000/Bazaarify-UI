import { Component, OnInit } from '@angular/core';
import { NotificationsService } from 'app/services/notifications/notifications.service';
import { Observable } from 'rxjs/Rx';
import { AngularFireDatabase } from 'angularfire2/database';
import { UserService } from 'app/services/user.service';

@Component({
  selector: 'app-notifications-panel',
  templateUrl: './notifications-panel.component.html',
  styleUrls: ['./notifications-panel.component.scss']
})
export class NotificationsPanelComponent implements OnInit {
  notifications: any;
  unreadNotificationsCount: number;
  notificationsAll: any;
  limitToShow: number;

  constructor(
    private db: AngularFireDatabase,
    private notificationsService: NotificationsService,
    private userService: UserService
  ) {
      this.unreadNotificationsCount = 0;
      this.limitToShow = 5;
  }


  showMore() {
    this.limitToShow += this.limitToShow;
    this.notifications = this.notificationsAll.slice(1, this.limitToShow);
  }

  markNotificationAsRead(notification) {
    this.notificationsService.markNotificationAsRead(notification);
  }

  deleteNotification(notification) {
    this.notificationsService.deleteNotification(notification);
  }

  ngOnInit() {
    this.notificationsService.getNotifications().subscribe(data => {
      this.notificationsAll = data;
      this.notifications = this.notificationsAll.slice(0, this.limitToShow);
    });
  }

  clearUnreadNotifications() {
    this.notificationsService.clearUnreadNotifications();
  }

}
