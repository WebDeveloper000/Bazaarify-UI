import { Component, OnInit } from '@angular/core';
import { ShareButtons } from '@ngx-share/core';

@Component({
  selector: 'app-social-share',
  templateUrl: './social-share.component.html',
  styleUrls: ['./social-share.component.scss']
})
export class SocialShareComponent implements OnInit {

  constructor(public share: ShareButtons) {
    this.share = share;
  }

  ngOnInit() {
  }

  openRedditShareWindow() {
    let test = window.open("https://www.reddit.com/submit?url=https://bazaarify.me&title=Bazaarify&r=Bazaarify", "Share to Reddit", "width=900,height=600,left=100,top=100");
  }

  openSteemitShareWindow() {
    let test = window.open("https://us-central1-bazaarify-97162.cloudfunctions.net/steemShare", "Share Bazzarify to steem", "width=600,height=600,left=100,top=100");
  }

}
