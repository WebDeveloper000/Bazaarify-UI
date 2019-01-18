import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { UserService } from 'app/services/user.service';
import { ConfigurationService } from 'app/services/configuration/configuration.service';
import { NotifyService } from 'app/services/notify/notify.service';
import { RecaptchaComponent } from 'ng-recaptcha';
import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
  user: User;
  captchaResponse: string;
  RecaptchaApiKey: string;
  showSpinner: Boolean = false;
  @ViewChild(RecaptchaComponent) captchaRef: RecaptchaComponent;

  constructor(
                  private notify: NotifyService,
                  private userService: UserService,
                  private configurationService: ConfigurationService,
                  private router: Router) {
    this.configurationService.getPublicConfiguration().subscribe(data => {
      this.RecaptchaApiKey = data['RecaptchaApiKey'];
    })
  }

  ngOnInit() {
    this.userService.user.subscribe(data => {
      if (data && data['uid']) {
        this.router.navigate(['/dashboard']);
      };
    });

    this.captchaResponse = '';
    this.user = {
      uid: '',
      email: '',
      password: '',
      provider: ''
    }
  }

  login() {
    this.showSpinner = true;
    this.userService.login(this.user)
      .then(res => {
        this.router.navigate(['/dashboard']);
        this.notify.success(res);
      })
      .catch(err => {
        this.showSpinner = false;
        this.notify.error(err);
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

  authViaGoogle() {
    this.showSpinner = true;
    this.userService.authViaGoogleProvider()
      .then(res => {
        this.notify.success(res);
        this.router.navigate(['/dashboard']);
      })
      .catch(err => {
        this.showSpinner = false;
        this.notify.error(err);
      })
  }

  authViaFacebook() {
    this.showSpinner = true;
    this.userService.authViaFacebookProvider()
      .then(res => {
        this.notify.success(res);
        this.router.navigate(['/dashboard']);
      })
      .catch(err => {
        this.showSpinner = false;
        this.notify.error(err);
      })
  }

  authViaTwitter() {
    this.showSpinner = true;
    this.userService.authViaTwitterProvider()
      .then(res => {
        this.notify.success(res);
        this.router.navigate(['/dashboard']);
      })
      .catch(err => {
        this.showSpinner = false;
        this.notify.error(err);
      })
  }

  authViaGithub() {
    this.showSpinner = true;
    this.userService.authViaGithubProvider()
      .then(res => {
        this.notify.success(res);
        this.router.navigate(['/dashboard']);
      })
      .catch(err => {
        this.showSpinner = false;
        this.notify.error(err);
      })
  }

  sendResetPasswordEmail() {
    this.userService.sendResetPasswordEmail(this.user.email)
      .then(res => {
        this.notify.success(res);
      })
      .catch(err => {
        this.notify.error(err);
      })
  }

}

interface User {
  uid: string;
  email: string;
  password: string;
  provider: string;
}

