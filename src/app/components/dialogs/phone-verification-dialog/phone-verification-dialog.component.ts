import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-phone-verification-dialog',
  templateUrl: './phone-verification-dialog.component.html',
  styleUrls: ['./phone-verification-dialog.component.scss']
})
export class PhoneVerificationDialogComponent implements OnInit {
  verificationToken: string;
  tempUserToken: string;
  qrCodeData: string;

  constructor(
    private http: HttpClient,
    public dialogRef: MatDialogRef<PhoneVerificationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      this.verificationToken = null;
      this.tempUserToken = null;
      this.qrCodeData = null;
      this.tempUserToken = this.data.twoFactorSecret;
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
      if (res['verified']) {
        return this.resolve();
      }
      return this.reject();
    })
    .catch(err => {
      return this.reject();
    });
  }

  resolve() {
    this.dialogRef.close({
      passed: true,
      userToken: this.tempUserToken
    });
  }

  reject() {
    this.dialogRef.close({ passed: false });
  }

  ngOnInit() {

  }

}
