import { Component, OnInit } from '@angular/core';
import { NotificationsService } from 'app/services/notifications/notifications.service';
import { Observable } from 'rxjs/Rx';
import { AngularFireDatabase } from 'angularfire2/database';
import { UserService } from 'app/services/user.service';
import { StoreService } from 'app/services/store/store.service';

@Component({
  selector: 'app-notifications-dialog',
  templateUrl: './notifications-dialog.component.html',
  styleUrls: ['./notifications-dialog.component.scss']
})
export class NotificationsDialogComponent implements OnInit {
  notifications: any;
  unreadNotificationsCount: number;
  notificationsAll: any;
  limitToShow: number;
  backdropWasClicked: Boolean;
  isNotificationsDialogVisible: Boolean;
  showSpinner: Boolean = false;

  constructor(
    private db: AngularFireDatabase,
    private notificationsService: NotificationsService,
    private userService: UserService,
    private storeService: StoreService,
  ) {
    this.unreadNotificationsCount = 0;
    this.limitToShow = 15;
    this.isNotificationsDialogVisible = false;
    this.backdropWasClicked = false;

    document.addEventListener('openNotificationsDialog', () => {
      this.isNotificationsDialogVisible = true;
      this.notificationsService.clearUnreadNotifications();
    }, false);

    document.addEventListener('closeNotificationsDialog', () => {
      this.isNotificationsDialogVisible = false;
    }, false);
  }

  /**
   * Backdrop was clicked while chatsDialog is active
   */
  onBackdropClicked(event) {
    this.isNotificationsDialogVisible = false;
  }

  closeNotificationsDialog() {
    this.notificationsService.closeNotificationsDialog();
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
    this.showSpinner = true;

    this.notificationsService.getNotifications().subscribe(data => {
      this.notificationsAll = data;
      console.log('all notification');
      console.log(data);
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
            } catch(e) {
              item.storeData.name = 'Name not provided';
            }
          });

        }
      });

      this.showSpinner = false;
    });

  }

  clearAllNotificatons() {
    this.notificationsService.clearAllNotifications();
  }



}
