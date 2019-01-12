import { Component, OnInit } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { ViewChild } from '@angular/core';
import { UserService } from 'app/services/user.service';
import { ConfigurationService } from 'app/services/configuration/configuration.service';
import { Router, Routes } from '@angular/router';
import { NotifyService } from 'app/services/notify/notify.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})

export class RegisterComponent implements OnInit {
  user: User;
  captchaResponse: string;
  RecaptchaApiKey: string;
  showSpinner: Boolean = false;
  @ViewChild('f') form: any;

  constructor(
    private notify: NotifyService,
    private userService: UserService,
    private router: Router,
    private configurationService: ConfigurationService) {
      this.configurationService.getPublicConfiguration().subscribe(data => {
        this.RecaptchaApiKey = data['RecaptchaApiKey'];
      })
  }

  ngOnInit() {
    this.userService.user.subscribe(data => {
      if (data && data['uid']) {
        this.router.navigate(['/dashboard']);
      };
    })


    this.captchaResponse = '';
    this.user = {
      uid: '',
      email: '',
      password: '',
    }
  }

  resolved(captchaResponse: string) {
    const newResponse = captchaResponse
      ? `${captchaResponse.substr(0, 7)}...${captchaResponse.substr(-7)}`
      : captchaResponse;
    this.captchaResponse += `${JSON.stringify(newResponse)}\n`;
  }

  register() {
    this.showSpinner = true;
    this.userService.register(this.user)
      .then(res => {
        this.form.resetForm();
        this.notify.success(res);
        this.router.navigate(['/login']);
      })
      .catch(err => {
        this.showSpinner = false;
        this.form.resetForm();
        this.notify.error(err);
      });
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
}

interface User {
  uid: string;
  email: string;
  password: string;
}
