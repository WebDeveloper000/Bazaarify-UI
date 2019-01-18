import { Component, OnInit } from '@angular/core';
import { NotificationsService } from 'app/services/notifications/notifications.service';
import { Observable } from 'rxjs/Observable';
import { AngularFireDatabase } from 'angularfire2/database';
import { StoreService } from 'app/services/store/store.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  notifications: any;
  notificationsAll: any;
  limitToShow: number;
  showSpinner: Boolean = false;

  constructor(
    private db: AngularFireDatabase,
    private notificationsService: NotificationsService,
    private storeService: StoreService,
  ) {
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

  clearAllNotificatons() {
    this.notificationsService.clearAllNotifications();
  }

  ngOnInit() {
    this.showSpinner = true;

    this.notificationsService.getNotifications().subscribe(data => {
      this.notificationsAll = data;
      this.notifications = this.notificationsAll.slice(0, this.limitToShow);
      this.notifications.map(item => {
        /**
         * If notification is from store
         */
        if (item['storeId']) {

          this.storeService.getStoreValue(item.storeId).subscribe(storeData => {
            item.storeData = {}
            this.storeService.getStoreMainavatar(item.storeId).subscribe(data => {
              item.storeData.thumb = data;
            }, err => {
              item.storeData.thumb = 'http://joappdeals.com/in/wp-content/themes/joapp/images/happyuser/default_user.png';
            })

            try {
              item.storeData.name = storeData.Settings.data.name || 'Name not provided';
            } catch (e) {
              item.storeData.name = 'Name not provided';
            }
          });

        }

      });

      this.showSpinner = false;
    });
    this.notificationsService.clearUnreadNotifications();
  }

}
