import { Injectable } from '@angular/core';
import { UserService } from 'app/services/user.service';
import { AngularFireDatabase, AngularFireObject } from 'angularfire2/database';

@Injectable()
export class PaymentService {

  constructor(
    private userService: UserService,
    private db: AngularFireDatabase
  ) { }

  recordUserPaymentTransaction(transactionObj) {
    console.log(transactionObj);
    let userUid = this.userService.userUid;
    this.db.list(`Users/${userUid}/Transactions/`).push(transactionObj);
  }

}
