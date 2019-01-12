import { Component, Inject, OnInit } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-notify-about-twofactor',
  templateUrl: './notify-about-twofactor.component.html',
  styleUrls: ['./notify-about-twofactor.component.scss']
})
export class NotifyAboutTwofactorComponent implements OnInit {

  constructor(
    private router: Router,
    public dialogRef: MatDialogRef<NotifyAboutTwofactorComponent>
  ) { }

  ngOnInit() {
  }

  enableTwoFactor() {
    this.router.navigate(['/account-settings']);
    this.closeDialog();
  }

  closeDialog() {
    this.dialogRef.close();
  }

}
