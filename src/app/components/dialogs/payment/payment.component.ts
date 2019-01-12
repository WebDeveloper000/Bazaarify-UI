import { Component, Inject, OnInit } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {

  constructor(
    private router: Router,
    public dialogRef: MatDialogRef<PaymentComponent>
  ) { }

  ngOnInit() {
  }

  proceedTwoPayment() {
    this.router.navigate(['/account-settings']);
    this.closeDialog();
  }

  closeDialog() {
    this.dialogRef.close();
  }

}
