import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireStorage } from 'angularfire2/storage';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';
import { UserService } from 'app/services/user.service';
import { ConfigurationService } from 'app/services/configuration/configuration.service';

@Injectable()
export class StoreService {
  constructor(
    private db: AngularFireDatabase,
    private storage: AngularFireStorage,
    private userService: UserService,
    private configurationService: ConfigurationService
  ) {
  }

  getStoreData(storeId) {
    return this.db.object(`Stores/${storeId}`).valueChanges().subscribe(data => {
      return data;
    });
  }

  getStoreValue(storeId): Observable<any> {
    return this.db.object(`Stores/${storeId}`).valueChanges();
  }

  getStoreSnapshot(storeId): Observable<any> {
    return this.db.object(`Stores/${storeId}`).snapshotChanges();
  }

  getStoresValue(storeIdsArr): Observable<any> {
    let storesObservables = [];
    storeIdsArr.map(storeId => {
      storesObservables.push(this.getStoreSnapshot(storeId).map(
        item => {
          console.log(item);
          let storeId = item['key'];
          let storeData = {};
          storeData[storeId] = item.payload.val();
          return storeData;
        }
      ));
    });
    return Observable.combineLatest(
      storesObservables
    );
  }

  getStoreMainavatar(storeId) {
    let ref = this.storage.ref(`Store/${storeId}/storeImages/logo.jpg`);
    // console.log(ref);
    if (ref) {
      return ref.getDownloadURL()
    } else {
      Observable.throw(() => {
        console.log('error');
      })
    }
  }

  getStorePrice() {
    let configuration = this.configurationService.getConfiguration();
    return configuration['UserEnrollments']['StorePrice'];
  }

  getStoreEnrollmentPeriod() {
    let configuration = this.configurationService.getConfiguration();
    return configuration['UserEnrollments']['EnrollmentPeriod'];
  }

}
