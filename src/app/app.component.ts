import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ConfigurationService } from 'app/services/configuration/configuration.service';
import { NotifyService } from 'app/services/notify/notify.service';
import { UserService } from 'app/services/user.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  userAuthed: Boolean;
  configurationLoaded: Boolean = false;
  userStatusWasLoaded: Boolean = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private configurationService: ConfigurationService,
    private notify: NotifyService,
    private http: HttpClient) {
    this.configurationLoaded = false;


    this.userService.user.subscribe(user => {
      this.userAuthed = user ? true : false;

      if (this.userAuthed) {
        /**
         * Load global configurationService
         */
        this.configurationService.setConfiguration().subscribe(data => {
          this.configurationLoaded = true;
        });
        /**
         * Calculate and load user account status data
         */
        this.userService.getUserAccountStatus().then(() => { this.userStatusWasLoaded = true; });

      } else {
        this.configurationLoaded = true;
      }
    });
  }

  ngOnInit() {
    this.router.events.subscribe(evt => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
      window.scrollTo(0, 0)
    });
  }
}
