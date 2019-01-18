import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { HttpClient } from '@angular/common/http';
import { UserService } from 'app/services/user.service';
import { NotifyService } from 'app/services/notify/notify.service';
import { MessagesService } from 'app/services/messages/messages.service';
import { StoreService } from 'app/services/store/store.service';
import { AngularFireDatabase } from 'angularfire2/database';
import { PaymentService } from 'app/services/payment/payment.service';
import { MatTableDataSource} from '@angular/material';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.scss']
})

export class AccountSettingsComponent implements OnInit {
  resetTokenPrompt: boolean;
  accordeonStep: number;
  verificationToken: string;
  tempUserToken: string;
  qrCodeData: string;
  twoFactorAuthEnabled: boolean;
  twoFactorSecret: string;
  newPassword: string = '';
  accountStatus: Object = {};
  passwordConfirmationField: string = '';
  showSpinner: boolean = false;
  showPaymentChangeSection: boolean = false;
  userBalanceData: Object = {};
  storesToPayFor: Array<any>;
  pastTransactionsTable: Array<Object>;
  displayedColumns: Array<string> = ['position', 'service', 'name', 'amount', 'period', 'status'];
  pastTransactionsDisplayedColumns: Array<string> = ['position', 'timestamp', 'type', 'amount', 'paymentId', 'billingId'];
  @ViewChild("changePasswordForm") changePasswordForm: ElementRef;

  // TODO for demo
  stores: {}[];
  selectedStores: any;
  storesLoading: boolean;

  constructor(
    private db: AngularFireDatabase,
    private http: HttpClient,
    private userService: UserService,
    private notify: NotifyService,
    private paymentService: PaymentService,
    private storeService: StoreService,
    private datePipe: DatePipe,
    private msg: MessagesService) {
      this.resetTokenPrompt = false;
      this.twoFactorAuthEnabled = false;
      this.twoFactorSecret = null;
      this.verificationToken = null;
      this.tempUserToken = null;
      this.qrCodeData = null;

      this.accordeonStep = 0;

      /**
       * By this check we know that user was registered with email formerly
       * so he should have opportunity to change his pass
       */
      if (this.userService.userMetaData && this.userService.userMetaData['emailVerified']) {
          this.showPaymentChangeSection = true;
      }

      this.userService.userData.valueChanges().subscribe(data => {
        this.twoFactorAuthEnabled = data['twoFactorAuthEnabled'];
        this.twoFactorSecret = data['twoFactorSecret'];
        if (! this.twoFactorAuthEnabled) {
          this.generateNewToken();
        } else {
          this.tempUserToken = this.twoFactorSecret;
        }
      });


    //  TODO for DEMO. SHOULD BE REMOVED LATER
      // Get all stores
      this.storesLoading = true;
      this.db.list('Stores').snapshotChanges().subscribe(data => {
        let stores = [];
        data.map(item => {
          let modified = item.payload.val();
          modified['Settings'] = {};
          modified['Settings']['storeId'] = item['key'];
          stores.push(modified)
        })
        this.storesLoading = false;
        this.stores = stores;
        this.selectedStores = {};
      })

    /**
     *
     * Get user balance
     */
    let counter = 1;
    let storePrice = this.storeService.getStorePrice();

    this.db.list(`Users/${this.userService.userUid}/Billings/CurrentBilling`).valueChanges().subscribe(res => {
      let storesToPayFor = [];

      /**
       *  As we have only one billing at a time
       */
      this.accountStatus = res[0];

      /**
       * If there is any balance on - show data
       */
      if (this.accountStatus['balance']) {
        this.accountStatus['billingItems'].map(item => {
          console.log(item);
          let fromPeriod = this.transformDate(+item['from']);

          let toPeriod  = this.transformDate(+item['to']);
          storesToPayFor.push( {
            position: counter,
            service: '',
            name: item['name'],
            amount: `${storePrice}.00 USD`,
            period: {
              fromPeriod: fromPeriod,
              toPeriod: toPeriod
            },
            status: 'Discountinued'
          });
          counter += 1;

        });
        storesToPayFor.push({
          position: counter,
          name: 'Total',
          amount: `${this.accountStatus['balance']}.00 USD`,
          period: ''
        });
        this.storesToPayFor = storesToPayFor;
        console.log(this.storesToPayFor);
      }

    })

    // Grab user previous transactions
    this.db.list(`Users/${this.userService.userUid}/Billings/PastBillings`).valueChanges().subscribe(res => {
      let pastTransactions = res;
      let pastTransactionsTable = [];
      let counter = 1;
      pastTransactions.map(item => {
        pastTransactionsTable.push(
          {
            position: counter,
            timestamp: item['timestamp'],
            type: item['paymentMethod'],
            amount: item['billingData']['balance'],
            paymentId: item['paymentData']['id'],
            billingId: item['billingId']
          }
        )
        counter +=1;
      });
      this.pastTransactionsTable = pastTransactionsTable;
      console.log(pastTransactionsTable);
    });

  }

  transformDate(timestamp) {
    let date = new Date(+timestamp);
    return this.datePipe.transform(date, 'dd-MM-yyyy');
  }

  ngOnInit() {

  }

  changePasswordFunc() {
    if (this.newPassword) {
      this.userService.changePassword(this.newPassword).then(data => {
        this.notify.success(data);
        this.userService.logout();
      }).catch(err => {
        this.notify.error(err);
      })
    }
  }
  changePassword() {
    /**
     * If 2F auth is enabled fot the account
     */
    if (this.twoFactorAuthEnabled) {
      this.userService.twoFactorAuth(true, this.twoFactorSecret)
        .then(res => {
          this.changePasswordFunc();
        })
        .catch(err => {
          this.notify.error(this.msg.get("two-factor-auth/verification-failed"));
        });
    } else {
      this.changePasswordFunc();
    }

  }

  resetNewPassword($event) {
    $event.preventDefault();
    this.changePasswordForm['form'].reset();
    this.newPassword = '';
    this.passwordConfirmationField = '';
  }

  // TODO for demo
  saveStores() {
    let stores = {};
    Object.keys(this.selectedStores).map(store => {
      stores[store] = {
        'storeId': store
      };
    });
    this.userService.userData.update({"Stores": stores}).then(() => {
      this.notify.info("Stores were connected");
    });
    this.selectedStores = {};
  }

  setStep(index: number) {
    this.accordeonStep = index;
  }

  disableTwoFactor() {
    this.userService.userData.valueChanges().subscribe(data => {
      this.userService.twoFactorAuth(true, data['twoFactorSecret'])
        .then(res => {
          this.verificationToken = null;
          this.resetTokenPrompt = false;
          this.userService.userData.update(
            {
              twoFactorAuthEnabled: null,
              twoFactorSecret: null
            }
          );
          this.notify.info(this.msg.get("two-factor-auth/was-disabled"));
        })
        .catch(err => {
          this.notify.error(this.msg.get("two-factor-auth/verification-failed"));
        });
    })
  }

  resetVerificationToken() {
    this.verificationToken = null;
    this.resetTokenPrompt = true;
    this.generateNewToken();
  }

  generateNewToken() {
    this.http.post('https://us-central1-bazaarify-97162.cloudfunctions.net/askTwoFactorToken', {})
      .toPromise()
      .then(res => {
        /**
         * Recieved temp base32 token and data for QR code to render for google authenticator
         */
        this.tempUserToken = res['tempUserToken'];
        this.qrCodeData = res['qrCodeData'];
      })
      .catch(err => {
        this.notify.error(err);
      });
  }

  verify() {
    this.http.post('https://us-central1-bazaarify-97162.cloudfunctions.net/verifyTwoFactorToken',
      {
        tempUserToken: this.tempUserToken,
        verificationToken: this.verificationToken
      }
    )
    .toPromise()
    .then(res => {
      this.verificationToken = null;
      if (res['verified']) {
        this.resetTokenPrompt = false;
        this.userService.userData.update(
          {
            twoFactorAuthEnabled: true,
            twoFactorSecret: this.tempUserToken
          }
        );
        this.notify.info(this.msg.get("two-factor-auth/was-enabled"));
      } else {
        this.notify.error(this.msg.get("two-factor-auth/verification-failed"));
      }
    })
    .catch(err => {
      this.resetTokenPrompt = false;
      this.verificationToken = null;
      this.notify.error(err);
    });
  }


  /**
   * Paypal settings
   */
  payment(data, actions) {
    return actions.payment.create({
      transactions: [
        {
          amount: { total: '1.00', currency: 'USD' }
        }
      ]
    });
  }
  onAuthorize(data, actions) {
    return actions.payment.execute().then(function() {
      // Show a success page to the buyer
    });
  }

}
