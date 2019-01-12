import { Injectable } from '@angular/core';
import { UserService } from 'app/services/user.service';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Subject';
import { combineLatest } from 'rxjs/observable/combineLatest';

@Injectable()
export class NotificationsService {
  private notifications: any;
  private unreadNotificationsCount: any;

  constructor(
    private db: AngularFireDatabase,
    private userService: UserService,
) {
    this.notifications = new Subject;
    this.unreadNotificationsCount = new Subject;

    this.setNotifications();
    this.setUnreadNotificationsCount();
  }

  /**
   * Dialog events
   */
  openNotificationsDialog() {
    let event = new CustomEvent('openNotificationsDialog');
    document.dispatchEvent(event);
  }

  closeNotificationsDialog() {
    let event = new CustomEvent('closeNotificationsDialog');
    document.dispatchEvent(event);
  }



  setNotifications() {
    let formated = [];

    this.notifications = this.userService.getUserStores().switchMap(stores => {
      if (stores && stores.length) {
        let notificationObservables = [];
        stores.map(store => {
          notificationObservables.push(this.db.list(`Stores/${store['key']}/Notifications`).valueChanges());
        });

        notificationObservables.push(this.db.list(`Users/${this.userService.userUid}/Notifications`).valueChanges());
        return Observable.combineLatest(
          notificationObservables,
          /**
           * Use this project function to modify the combined value. To flatten the arrays into a single array.
           */
          (...arrays) => arrays.reduce((acc, array) => [...acc, ...array], [])
          /**
           * This one to sort notifications by date timestamp
           */
            .filter(item => (item && item['data'] && item['data']['timestamp'] ? true : false))
            .sort((a: any, b: any) => new Date(b.data.timestamp).getTime() - new Date(a.data.timestamp).getTime())
        );
      } else {
        return Observable.of([]);
      }
    });
  }

  setUnreadNotificationsCount() {
    this.notifications.subscribe(notifications => {
      let counter = 0;
      notifications.map(notification => {
        if (notification['data'] && ! notification['data']['read']) {
          counter += 1;
        }
      })
      this.unreadNotificationsCount.next(counter);
    });
  }

  getNotifications(): Observable<any[]> {
    return this.notifications;
  }

  getUnreadNotificationsCount(): Observable<any[]> {
    return this.unreadNotificationsCount.asObservable();
  };

  clearAllNotifications() {
    return new Promise((resolve, reject) => {
      this.getNotifications().take(1).subscribe(notifications => {
        notifications.map(notification => {
          this.db.object(`Stores/${notification.storeId}/Notifications/${notification.fbId}`).set(null);
        });
        return resolve();
      });
    });
  }

  clearUnreadNotifications() {
    return new Promise((resolve, reject) => {
      this.getNotifications().take(1).subscribe(notifications => {
        let counter = 0;
        notifications.map(notification => {
          if (! notification['data']['read']) {
            this.markNotificationAsRead(notification);
          }
        });
        return resolve(counter);
      });
    });
  }

  markNotificationAsRead(notification) {
    notification['data']['read'] = true;
    if (notification['storeId']) {
      let notificationRef = this.db.object(`Stores/${notification.storeId}/Notifications/${notification.fbId}`);
      notificationRef.update(
        {
          "data/read": true,
          "direction": "fbob"
        }
      );
    } else {
      let notificationRef = this.db.object(`Users/${this.userService.userUid}/Notifications/${notification.fbId}`);
      notificationRef.update(
        {
          "data/read": true
        }
      );
    }
  }

  deleteNotification(notification) {
    let notificationRef = this.db.object(`Stores/${notification.storeId}/Notifications/${notification.fbId}`);
    notificationRef.set(null);
  }

}
