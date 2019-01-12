import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { StoreService } from 'app/services/store/store.service';

@Component({
  selector: 'app-chat-card',
  templateUrl: './chat-card.component.html',
  styleUrls: ['./chat-card.component.scss']
})
export class ChatCardComponent implements OnChanges {
  @Input() chat;
  sender: any;
  recipient: any;

  constructor(
    private storeService: StoreService,
  ) {
  }

  ngOnChanges(changes: SimpleChanges) {
    let chatListener = changes['chat'];
    if (chatListener && chatListener['currentValue']) {
        let data = chatListener['currentValue'];
        let senderId = data['storeId'];
        let recipientId = data['peerId'];

        this.storeService.getStoreValue(senderId).subscribe(storeData => {
          this.sender = {};
          this.storeService.getStoreMainavatar(senderId).subscribe(data => {
            this.sender.thumb = data;
          }, err => {
            this.sender.thumb = 'http://joappdeals.com/in/wp-content/themes/joapp/images/happyuser/default_user.png';
          })

          try {
            this.sender.name = storeData.Settings.data.name || 'Name not provided';
          } catch(e) {
            this.sender.name = 'Name not provided';
          }

        });

        this.storeService.getStoreValue(recipientId).subscribe(storeData => {
          this.recipient = {};
          this.storeService.getStoreMainavatar(recipientId).subscribe(data => {
            this.recipient.thumb = data;
          }, err => {
            this.recipient.thumb = 'http://joappdeals.com/in/wp-content/themes/joapp/images/happyuser/default_user.png';
          })

          try {
            this.recipient.name = storeData.Settings.data.name || 'Name not provided';
          } catch(e) {
            this.recipient.name = 'Name not provided';
          }
        });
    };
  }

}
