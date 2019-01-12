import { Component, OnInit } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { ViewChild } from '@angular/core';
import { UserService } from 'app/services/user.service';
import { NotifyService } from 'app/services/notify/notify.service';
import { RecaptchaComponent } from 'ng-recaptcha';
import { ConfigurationService } from 'app/services/configuration/configuration.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  userEmail: string;
  captchaResponse: string;
  @ViewChild('f') form: any;
  RecaptchaApiKey: string;
  showSpinner: Boolean = false;
  @ViewChild(RecaptchaComponent) captchaRef: RecaptchaComponent;

  constructor(
    private notify: NotifyService,
    private userService: UserService,
    private router: Router,
    private configurationService: ConfigurationService) {
      this.userEmail = null;

      this.configurationService.getPublicConfiguration().subscribe(data => {
        this.RecaptchaApiKey = data['RecaptchaApiKey'];
      })

      this.captchaResponse = '';
  }

  ngOnInit() {
    this.userService.user.subscribe(data => {
      if (data && data['uid']) {
        this.router.navigate(['/dashboard']);
      };
    })

  }

  toggleCaptcha() {
    this.captchaResponse ? this.captchaRef.reset() : this.captchaRef.execute();
  }

  resolved(captchaResponse: string) {
    const newResponse = captchaResponse
      ? `${captchaResponse.substr(0, 7)}...${captchaResponse.substr(-7)}`
      : captchaResponse;
    this.captchaResponse += `${JSON.stringify(newResponse)}\n`;
  }

  sendResetPasswordEmail() {
    this.showSpinner = true;
    this.userService.sendResetPasswordEmail(this.userEmail)
      .then(res => {
        console.log(res);
        this.form.resetForm();
        this.notify.success(res);
        this.router.navigate(['/login']);
      })
      .catch(err => {
        this.showSpinner = false;
        this.notify.error(err);
      })
  }

}
