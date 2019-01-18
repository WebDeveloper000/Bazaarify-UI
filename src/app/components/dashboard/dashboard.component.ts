import { Component, OnInit } from '@angular/core';
import { UserService } from 'app/services/user.service';
import { Router, Routes } from '@angular/router';
import { NotifyService } from 'app/services/notify/notify.service';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { MatDialog } from '@angular/material';
import { NotifyAboutTwofactorComponent } from 'app/components/dialogs/notify-about-twofactor/notify-about-twofactor.component';
import { PaymentComponent } from 'app/components/dialogs/payment/payment.component';
import { MessagingService } from "app/services/messaging.service";
import { SearchService } from "app/services/search/search.service";
import { AngularFireDatabase } from 'angularfire2/database';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent implements OnInit {
  message;
  private searchTerm: string;
  searchResultsFilter: string = 'all';

  constructor( private searchService: SearchService, private db: AngularFireDatabase, public afAuth: AngularFireAuth, private msgService: MessagingService, private notify: NotifyService, private userService: UserService, private router: Router, public dialog: MatDialog) {
    this.searchTerm = '';
  }

  keyDownFunction(event) {
    if(event.keyCode == 13 && this.searchTerm) {
      this.search();
    }
  }
  ngOnInit() {
    /**
     * Prompts to grab user fcm access & tokens
     */
    this.msgService.getPermission()
    this.msgService.receiveMessage()
    this.message = this.msgService.currentMessage;

    /**
     * Promt to ask user to enable 2F auth
     */
    if (! sessionStorage.getItem('2FpromptWasFired')) {
      let userDataSubscriber = this.userService.userData.valueChanges().subscribe(data => {
        userDataSubscriber.unsubscribe();
        if (! data['twoFactorAuthEnabled']) {
          sessionStorage.setItem('2FpromptWasFired', 'true');
          let dialogRef = this.dialog.open(NotifyAboutTwofactorComponent, {
            width: '600px'
          });
        }
      });
    }

    /**
     * Promt to ask user to enable 2F auth
     */

    if (! sessionStorage.getItem('balancePromptWasFired')) {
      console.log(this.userService.userUid);
      this.db.list(`Users/${this.userService.userUid}/Billings/CurrentBilling`).valueChanges().subscribe(res => {
        let accountStatus = res[0];
        console.log(accountStatus);
        if (accountStatus['balance']) {
          sessionStorage.setItem('balancePromptWasFired', 'true');
          let dialogRef = this.dialog.open(PaymentComponent, {
            width: '600px'
          });
        }
      });
    }
  }

  logout() {
    this.userService.logout()
      .then(res => {
        this.notify.success(res);
        this.router.navigate(['/login']);
      })
      .catch(err => {
        this.notify.error(err);
      })
  }

  search() {
    this.searchService.openSearchDialog({
        searchTerm: this.searchTerm,
        searchResultsFilter: this.searchResultsFilter
    });
    this.searchTerm = '';
    this.searchResultsFilter = 'all';
  }

  toggleSearchResultsFilter(filterValue) {
    this.searchResultsFilter = filterValue;
  }

}
