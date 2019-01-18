import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { AngularFireAuth } from 'angularfire2/auth';

@Injectable()
export class ConfigurationService {
  public configuratoin: any;

  constructor(
    private db: AngularFireDatabase,
    private afAuth: AngularFireAuth,
  ) {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.setConfiguration().subscribe(data => {
          this.configuratoin = data;
        });
      }
    });
  }


  getConfiguration() {
    return this.configuratoin;
  }

  setConfiguration() {
    return this.db.object(`SystemSettings/Global/`).valueChanges();
  }

  getPublicConfiguration() {
    return this.db.object(`SystemSettings/Public`).valueChanges();
  }

}
