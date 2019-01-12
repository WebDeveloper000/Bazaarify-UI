import { Component, OnInit } from '@angular/core';
import { UserService } from 'app/services/user.service';
import { PaymentService } from 'app/services/payment/payment.service';
import { NotifyService } from 'app/services/notify/notify.service';
import { CryptoPaymentsService } from 'app/services/crypto-payments/crypto-payments.service';
import { AngularFireDatabase } from 'angularfire2/database';
import { HttpClient } from '@angular/common/http';
import {Observable} from 'rxjs/Rx';
import { Router, Routes } from '@angular/router';

@Component({
  selector: 'app-paying',
  templateUrl: './paying.component.html',
  styleUrls: ['./paying.component.scss']
})
export class PayingComponent implements OnInit {
  accountStatus: Object = {};
  cryptoPayment: Object = {
    type: 'BTC',
    source: 'storeWallet',
    ammount: 0,
    qrcode: null,
    address: null
  }
  showSpinner: Boolean = false;

  bitcoinTransactionConfirmed: Object = {
    configured: false,
    expired: false,
    expirationTime: null,
    minerFees: [],
    addresses: []
  }

  constructor(
    private http: HttpClient,
    private db: AngularFireDatabase,
    private userService: UserService,
    private paymentService: PaymentService,
    private cryptoPaymentsService: CryptoPaymentsService,
    private notify: NotifyService,
    private router: Router
  ) {
    /**
     *
     * Get user balance
     */
    this.db.list(`Users/${this.userService.userUid}/Billings/CurrentBilling`).valueChanges().map(res => {
      let storesToPayFor = [];

      /**
       *  As we have only one billing at a time
       */
      this.accountStatus = res[0];

      if (this.accountStatus && this.accountStatus['balance']) {
        /**
         * Set up crypto payment data
         */
        this.cryptoPaymentsService
          .convertUsdTo(this.accountStatus['balance'], this.cryptoPayment['type'])
          .then(res => {
            this.cryptoPayment['ammount'] = res;
          })
          .catch(err => {
            console.log(err);
          })

        /**
         * If there is bitpay transaction waiting for confirmation
         */
        if (this.accountStatus['bitcoinTransactionConfirmed'] && this.accountStatus['cryptoPayment']) {
          let data = this.accountStatus['bitcoinTransactionConfirmed'];

          this.bitcoinTransactionConfirmed['expired'] = data['expired'] || false;
          this.bitcoinTransactionConfirmed['addresses'] = data['paymentCodes'];
          this.bitcoinTransactionConfirmed['minerFees'] = data['minerFees'];
          this.bitcoinTransactionConfirmed['paymentSubtotals'] = data['paymentSubtotals'];
          this.bitcoinTransactionConfirmed['paymentTotals'] = data['paymentTotals'];
          this.bitcoinTransactionConfirmed['expirationTime'] = new Date(data['expirationTime']).toString();
          this.bitcoinTransactionConfirmed['configured'] = true;

          let qrcodestring = '';
          console.log(this.accountStatus['cryptoPayment']['type']);
          if (this.accountStatus['cryptoPayment']['type'] == 'BTC') {
            // qrcodestring += 'bitcoin:?r=';
          } else {
            // qrcodestring += 'bitcoincash:?r=';
          }
          let type = this.accountStatus['cryptoPayment']['type'];

          qrcodestring += data.paymentCodes[type]['BIP73'].replace("https://test.bitpay.com/i/", '');
          this.bitcoinTransactionConfirmed['qrcodedata'] = qrcodestring;

          if (! this.bitcoinTransactionConfirmed['expired']) {
            this.cryptoPayment = this.accountStatus['cryptoPayment'];
          }
        } else {
          /**
           * TODO
           * Move to separate func
           * Reset payment data to default
           */
          this.bitcoinTransactionConfirmed = {
            configured: false,
            expired: false,
            expirationTime: null,
            minerFees: [],
            addresses: []
          };
          this.cryptoPayment = {
            type: 'BTC',
            source: 'storeWallet',
            ammount: 0,
            qrcode: null,
            address: null
          };
        }
      }

    })
      .subscribe(data => {

          /**
           * Check for expiration
           */
          Observable.interval(1000).subscribe(() => {
            if (this.accountStatus && this.accountStatus['bitcoinTransactionConfirmed']) {

              if ( new Date().getTime() >= this.accountStatus['bitcoinTransactionConfirmed']['expirationTime'] ) {
                this.db.object(`Users/${this.userService.userUid}/Billings/CurrentBilling/${this.accountStatus['billingId']}/bitcoinTransactionConfirmed`)
                .update({
                  'expired': true
                })
              }
            }

          })

      })

  }

  onCryptoCurrencyChange() {
    /**
     * Set up crypto payment data
     */
    this.cryptoPaymentsService
      .convertUsdTo(this.accountStatus['balance'], this.cryptoPayment['type'])
      .then(res => {
        this.cryptoPayment['ammount'] = res;
      })
      .catch(err => {
        console.log(err);
      })
  }

  ngOnInit() {
    this.loadPaypalCheckout();
  }

  approveExternalWalletPayment() {
    this.db.object(`Users/${this.userService.userUid}/Billings/CurrentBilling/${this.accountStatus['billingId']}/bitcoinTransactionConfirmed/`)
      .update({
        'expired': true
      });
    this.router.navigate(['/account-settings']);
  }

  cancelExternalWalletPayment() {
    this.db.object(`Users/${this.userService.userUid}/Billings/CurrentBilling/${this.accountStatus['billingId']}`)
      .update({
        'bitcoinTransactionConfirmed': null,
        'cryptoPayment': null
      })
  }

  confirmExternalWalletPayment() {
    this.showSpinner = true;

    this.http.post('https://us-central1-bazaarify-97162.cloudfunctions.net/generateBitPayInvoice', {'ammount': this.accountStatus['balance']})
      .toPromise()
      .then(res => {
        console.log('BITPAY');
         console.log(res);
         this.db.object(`AwaitingBipayConfirmation/${res['id']}`).set({
            transactionId: res['id'],
            userUid: this.userService.userUid,
            billingId: this.accountStatus['billingId'],
            paymentMethod: this.cryptoPayment['type']
         });
         return res;
      })
      .then(res => {
        return this.db.object(`Users/${this.userService.userUid}/Billings/CurrentBilling/${this.accountStatus['billingId']}`)
        .update({
          bitcoinTransactionConfirmed: res
        })
      })
      .then(() => {
        return this.db.object(`Users/${this.userService.userUid}/Billings/CurrentBilling/${this.accountStatus['billingId']}`)
          .update({
            cryptoPayment: this.cryptoPayment
          })
      })
      .then(() => {
        this.showSpinner = false;
      })
      .catch(err => {
        this.showSpinner = false;
        this.notify.error(err.message);
      })
  }


  loadPaypalCheckout() {
    /**
     * Load paypal sdk
     */
    if (! window['paypal']) {
      let node = document.createElement('script');
      node.onload = () => {
        this.initPaypalButton();
      };
      node.src = 'https://www.paypalobjects.com/api/checkout.js';
      node.type = 'text/javascript';
      document.getElementsByTagName('head')[0].appendChild(node);
      this.initPaypalButton();
    } else {
      this.initPaypalButton();
    }
  }

  initPaypalButton() {
    let self = this;
    /**
     * Init paypal button
     */
    if (document.getElementById('paypal-button')) {
      window['paypal'].Button.render({
        env: 'sandbox', // Or 'sandbox'
        client: {
          // sandbox:    'Aep2yb5Ox34JxksX6SesBZpnpxrIpsTEfQpGJ3zsmfJCQMZR5xwm7hCYzGbcOYdwRy0lM0I0NVWUwyIi',
          sandbox:    'ASxQQRBegpfBoETJSg05wpT1fU0lh4DWddvCw8TVL1IwnkENpteCIUlMRicHe2-IIRTZ2XxbvQgn6OEA',
          production: 'EASRXD-diub0_OPzGHo1GkIVEVq90UuayQcYry1VAuCGNXHA9RpcgK6lja7kb6UlWLpbE_eyi3021QiT'
        },
        commit: true, // Show a 'Pay Now' button
        payment: (data, actions) => {
          return actions.payment.create({
            payment: {
              transactions: [
                {
                  amount: { total: this.accountStatus['balance'] + '.00', currency: 'USD' }
                }
              ]
            },
            experience: {
              input_fields: {
                no_shipping: 1
              }
            }
          });
        },
        onAuthorize: (data, actions) => {
          return actions.payment.execute().then(payment => {
            let paymentObj = payment;

            this.http.post('https://us-central1-bazaarify-97162.cloudfunctions.net/recordTransaction', {
                userUid: this.userService.userUid,
                paymentMethod: 'paypal',
                paymendData: paymentObj,
                billingId: this.accountStatus['billingId']
              })
              .subscribe(data => {
                this.router.navigate(['/account-settings']);
                this.notify.success('Payment was made');
              })

            // The payment is complete!
            // You can now show a confirmation message to the customer
          }).catch(err => {
            this.notify.error('Error occured during payment');
            console.error(err);
          });
        },
        onCancel: (data, actions) => {
          this.notify.info('Payment was canceled');
        },
        onError: (err, actions) => {
          // self.notify.error(err['message']);
        }
      }, '#paypal-button');
    }
  }
}
