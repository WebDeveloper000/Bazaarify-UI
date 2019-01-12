import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';

@Injectable()
export class NotifyService {
  duration: number;

  constructor(private snackBar: MatSnackBar) {
    this.duration = 5000;
  }

  info(data) {
    this.snackBar.open(data, 'Close', {duration: this.duration, panelClass: 'mat-snack-bar-info'});
  }

  success(data) {
    this.snackBar.open(data, 'Close', {duration: this.duration, panelClass: 'mat-snack-bar-success'});
  }

  error(data) {
    this.snackBar.open(data, 'Close', {duration: this.duration, panelClass: 'mat-snack-bar-error'});
  }

}
