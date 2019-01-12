import { Component, OnInit, AfterViewInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { HelpComponent } from 'app/components/dialogs/help/help.component';
import { FacebookService, InitParams } from 'ngx-facebook';
import { Router, NavigationEnd } from '@angular/router';
import { ConfigurationService } from 'app/services/configuration/configuration.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements AfterViewInit {

  constructor(public dialog: MatDialog, private fb: FacebookService, private _router: Router, private configurationService: ConfigurationService) {
    this.configurationService.setConfiguration().subscribe(configuration => {
      let initParams: InitParams = {
        appId: configuration['Social']['Facebook']['AppId'],
        xfbml: true,
        version: 'v2.11'
      };

      fb.init(initParams);
    });
  }

  ngAfterViewInit () {
    /**
     * Need this hack to reinit twitter widgets on app route was changed
     */
    if (document.getElementById("twitter-wjs")) {
      document.getElementById("twitter-wjs").remove();
    }
    /**
     * Load twitter API
     */
    (<any>window).twttr = (function (d, s, id) {
      let js: any, fjs = d.getElementsByTagName(s)[0],
        t = (<any>window).twttr || {};
      if (d.getElementById(id)) return t;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://platform.twitter.com/widgets.js";
      fjs.parentNode.insertBefore(js, fjs);

      t._e = [];
      t.ready = function (f: any) {
        t._e.push(f);
      };
      return t;
    }(document, "script", "twitter-wjs"));
  }

  openHelpDialog() {
    let dialogRef = this.dialog.open(HelpComponent, {
      width: '600px',
      data: {placement: 'footer'}
    });
  }

}
