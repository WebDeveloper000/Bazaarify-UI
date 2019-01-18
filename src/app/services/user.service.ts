import { Injectable, Output, EventEmitter } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { Router, Routes } from '@angular/router';
import { AngularFireDatabase, AngularFireObject } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { MessagesService } from './messages/messages.service';
import { Md5 } from 'ts-md5/dist/md5';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { PhoneVerificationDialogComponent } from 'app/components/dialogs/phone-verification-dialog/phone-verification-dialog.component';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ConfigurationService } from './configuration/configuration.service';
import * as moment from 'moment';

@Injectable()
export class UserService {
  customToken: string;
  public user: Observable<firebase.User>;
  public userData: AngularFireObject<any>;
  public userUid: String;
  public userMetaData: any;
  public userAccountStatus: Observable<Object>;

  constructor(
    private db: AngularFireDatabase,
    public afAuth: AngularFireAuth,
    private msg: MessagesService,
    public dialog: MatDialog,
    private router: Router,
    private configurationService: ConfigurationService,
    private http: HttpClient) {
      this.user = this.afAuth.authState;
      this.user.subscribe(data => {
        if (data) {
          let userUid = data.uid;
          this.userUid = userUid;
          this.userMetaData = data;
          this.userData = this.db.object(`Users/${userUid}`);
        } else {
          this.router.navigate(['/login']);
        }
      });
  }

  getCustomToken(uid) {
    return new Promise((resolve, reject) => {
      this.http.post('https://us-central1-bazaarify-97162.cloudfunctions.net/getCustomTokenByUId', { uid })
        .toPromise()
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject();
        });
    });
  }

  changePassword(newPassword) {
    return new Promise((resolve, reject) => {
      this.http.post('https://us-central1-bazaarify-97162.cloudfunctions.net/changeUserPasswordByUid', {
          uid: this.userUid,
          newPassword: newPassword
        })
        .toPromise()
        .then(res => {
          resolve(this.msg.get("auth/password-was-changed"));
        })
        .catch(err => {
          reject(this.msg.get(err.error || err));
        })
    });
  }

  loginWithCustomToken(token) {
    return new Promise((resolve, reject) => {
      this.afAuth.auth.signInWithCustomToken(token)
        .then(() => {
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  twoFactorAuth(isTwoFactorEnabled, twoFactorSecret) {
    return new Promise((resolve, reject) => {

      /**
       * If twofactor is disabled skip this step
       */
      if (!isTwoFactorEnabled || !twoFactorSecret) return resolve();

      if(isTwoFactorEnabled && twoFactorSecret){
        /**
         * If twofactor is enabled
         */
        let userTwoFactorAuthConfig = { twoFactorSecret }

        let dialogRef = this.dialog.open(PhoneVerificationDialogComponent, {
          width: '400px',
          data: userTwoFactorAuthConfig
        });

        let twoFactorDialogSubscriber = dialogRef.afterClosed().subscribe(result => {
          twoFactorDialogSubscriber.unsubscribe();
          if (result) {
            if (result.passed) {
              return resolve(this.msg.get("two-factor-auth/verification-passed"));
            }
            return reject(this.msg.get("two-factor-auth/verification-failed"));
          }
          return reject(this.msg.get("two-factor-auth/canceled-by-user"));
        });
      }

    });
  }


  sendResetPasswordEmail(email) {
    return new Promise((resolve, reject) => {
      this.afAuth.auth.sendPasswordResetEmail(email)
        .then(() => {
          resolve(this.msg.get("auth/password-reset"));
        })
        .catch(err => {
          reject(this.msg.get(err.code) || err);
        });
    });
  }

  /**
   * Email + password based auth
   * @param credentials
   */
  login(credentials): Promise<any> {
    let loginResponse = null;
    return new Promise((resolve, reject) => {
      this.http.post('https://us-central1-bazaarify-97162.cloudfunctions.net/login', credentials)
        .toPromise()
        .then(res => {
          loginResponse = res;
          return this.twoFactorAuth(loginResponse['isTwoFactorEnabled'], loginResponse['twoFactorSecret']);
        })
        .then(res => {
          return this.loginWithCustomToken(loginResponse['authToken'])
        })
        .then(() => {
          resolve(this.msg.get("auth/user-logged-in"));
        })
        .catch(err => {
          reject(this.msg.get(err.error || err));
        })
    });
  }

  logout() {
    return new Promise((resolve, reject) => {
      /**
       * For user 2F auth enabling prompt. Should fire once per app session
       */
      sessionStorage.removeItem('2FpromptWasFired');

      this.afAuth.auth.signOut()
        .then(() => {
          resolve(this.msg.get("auth/user-logged-out"));
        })
        .catch(err => {
          reject(this.msg.get(err.code) || err);
        })
    });
  }

  /**
   * Email + password plain auth
   * @param user
   * @returns {Promise}
   */
  register( user) {
    // if (
    //     user.email != 'vanyatsybulin@gmail.com' &&
    //     user.email != 'imransmail@gmail.com' &&
    //     user.email != 'info@solutionjet.net'
    // ) {
    //   return new Promise((resolve, reject) => {
    //     return reject('Access is restricted for this email');
    //   });
    // }
    // else return new Promise((resolve, reject) => {
    return new Promise((resolve, reject) => {
      this.afAuth.auth.createUserWithEmailAndPassword(user.email, user.password)
        .then(() => {
          /**
           * Sending mandatory email confirmation link
           */
          this.afAuth.auth.currentUser.sendEmailVerification();
        })
        .then(res => {
          this.afAuth.auth.signOut();
          resolve(this.msg.get("auth/account-registered"));
        })
        .catch(err => {
          reject(this.msg.get(err.code || err));
        })
    });
  }

  authViaGoogleProvider() {
    // return new Promise((resolve, reject) => {
    //   return reject('Access is restricted');
    // });

    return new Promise((resolve, reject) => {
      let userData = null;
      this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
        .then(res => {
          this.afAuth.auth.signOut();
          return this.getCustomToken(res.user.uid);
        })
        .then(res => {
          userData = res;
          return this.twoFactorAuth(userData['isTwoFactorEnabled'], userData['twoFactorSecret']);
        })
        .then(() => {
          return this.loginWithCustomToken(userData['authToken'])
        })
        .then(() => {
          resolve(this.msg.get("auth/user-logged-in"));
        })
        .catch(err => {
          reject(this.msg.get(err.code) || err);
        });
    });
  }

  authViaFacebookProvider() {
    // return new Promise((resolve, reject) => {
    //   return reject('Access is restricted');
    // });


    return new Promise((resolve, reject) => {
      let userData = null;
      this.afAuth.auth.signInWithPopup(new firebase.auth.FacebookAuthProvider())
        .then(res => {
          this.afAuth.auth.signOut();
          return this.getCustomToken(res.user.uid);
        })
        .then(res => {
          userData = res;
          return this.twoFactorAuth(userData['isTwoFactorEnabled'], userData['twoFactorSecret']);
        })
        .then(() => {
          return this.loginWithCustomToken(userData['authToken'])
        })
        .then(() => {
          resolve(this.msg.get("auth/user-logged-in"));
        })
        .catch(err => {
          reject(this.msg.get(err.code) || err);
        });
    });
  }

  authViaTwitterProvider() {
    // return new Promise((resolve, reject) => {
    //   return reject('Access is restricted');
    // });


    return new Promise((resolve, reject) => {
      let userData = null;
      this.afAuth.auth.signInWithPopup(new firebase.auth.TwitterAuthProvider())
        .then(res => {
          this.afAuth.auth.signOut();
          return this.getCustomToken(res.user.uid);
        })
        .then(res => {
          userData = res;
          return this.twoFactorAuth(userData['isTwoFactorEnabled'], userData['twoFactorSecret']);
        })
        .then(() => {
          return this.loginWithCustomToken(userData['authToken'])
        })
        .then(() => {
          resolve(this.msg.get("auth/user-logged-in"));
        })
        .catch(err => {
          reject(this.msg.get(err.code) || err);
        });
    });
  }

  authViaGithubProvider() {
    // return new Promise((resolve, reject) => {
    //   return reject('Access is restricted');
    // });


    return new Promise((resolve, reject) => {
      let userData = null;
      this.afAuth.auth.signInWithPopup(new firebase.auth.GithubAuthProvider())
        .then(res => {
          this.afAuth.auth.signOut();
          return this.getCustomToken(res.user.uid);
        })
        .then(res => {
          userData = res;
          return this.twoFactorAuth(userData['isTwoFactorEnabled'], userData['twoFactorSecret']);
        })
        .then(() => {
          return this.loginWithCustomToken(userData['authToken'])
        })
        .then(() => {
          resolve(this.msg.get("auth/user-logged-in"));
        })
        .catch(err => {
          reject(this.msg.get(err.code) || err);
        });
    });
  }

  getUserStores() {
    return this.db.list(`Users/${this.userUid}/Stores`).valueChanges().switchMap(stores => {

      let chatsObservables = [];

      stores.map(store => {
        chatsObservables.push(this.db.object(`Stores/${store['storeId']}`).snapshotChanges());
      });

      if (stores && stores.length) {
        return Observable.combineLatest(
          chatsObservables
          /**
           * Use this project function to modify the combined value. To flatten the arrays into a single array.
           */
        ).map(stores => {
          let result = stores.map(store => {
            return {
              'key': store['key'],
              'data': store['payload'].val()
            }
          });

          return result;
        })
      } else {
        return Observable.of([]);
      }

    });
  }

  getUserStoresConfiguration() {
    return this.db.list(`Users/${this.userUid}/Stores`).valueChanges();
  }

  getUserStoresConfigurationSnapshot() {
    return this.db.list(`Users/${this.userUid}/Stores`).snapshotChanges().map(stores => {
      let result = {};
      stores.map(store => {
        result[store['key']] = store.payload.val()
      })
      return result;
    });
  }

  datesDiff(startDate, endDate) {
    let start = moment(startDate);
    let end = moment(endDate);
    return  end.diff(start, 'days');
  }

  getCurrentServerTime() {
    return this.http.get('https://us-central1-bazaarify-97162.cloudfunctions.net/getServerTimestamp');
  }

  getUserBalance() {
    let configuration = this.configurationService.getConfiguration();
    let storePrice = configuration['UserEnrollments']['StorePrice'];
    let enrollmentPeriod = configuration['UserEnrollments']['EnrollmentPeriod'];

    return this.getCurrentServerTime().switchMap(res => {
      let currentDate = res['timestamp'];

      return this.getUserStoresConfiguration().switchMap(data => {
        let userStores = data;
        return new Observable(observer => {
          let overdueStores = {
            balance: 0,
            storesToPayFor: []
          };

          if (userStores && userStores.length) {
            userStores.map(store => {
              if (! store['recentPaymentDate'] ||
                (store['recentPaymentDate'] && this.datesDiff(store['recentPaymentDate'], currentDate) > enrollmentPeriod) ) {
                overdueStores['balance'] += storePrice;
                overdueStores['storesToPayFor'].push(store['storeId']);
              }
            });
          }

          observer.next( overdueStores );
          observer.complete();
        });

      })

    });
  }

  getUserAccountStatus() {
    return new Promise((resolve, reject) => {
      let userUid = this.userUid;
      this.http.post('https://us-central1-bazaarify-97162.cloudfunctions.net/getUserAccountStatus', { userUid })
        .subscribe(res => {
          resolve();
        }, err => {
          console.log(err);
          reject(err);
        })
    });
  }

  updateStorePayment(storeId) {
    this.getCurrentServerTime().subscribe(res => {
      let paymentDate = res['timestamp'];
      this.db.object(`Users/${this.userUid}/Stores/${storeId}`).update({'recentPaymentDate': paymentDate});
    });
  }
}


