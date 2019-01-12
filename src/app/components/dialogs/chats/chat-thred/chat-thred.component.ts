import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild, Input, Output } from '@angular/core';
import { ChatsService } from '../../../../services/chats/chats.service';
import { Observable } from 'rxjs/Observable';
import { AngularFireDatabase } from 'angularfire2/database';
import { UserService } from '../../../../services/user.service';
import { DatePipe } from '@angular/common';
import { StoreService } from '../../../../services/store/store.service';
import { DomSanitizer }from '@angular/platform-browser';

@Component({
  selector: 'app-chat-thred',
  templateUrl: './chat-thred.component.html',
  styleUrls: ['./chat-thred.component.scss']
})
export class ChatThredComponent implements OnInit {
  chats: any;
  chatThread: any;
  newMessage: any;
  openedChatThread: any;
  openedChatThreadRef: any;
  chatThreadData: any;
  backdropWasClicked: Boolean;
  recipient: any;
  isThreadDialogVisible: Boolean;
  showStoreSelect: Boolean;
  /**
   * Case when we dont have active chat or sender is missing
   */
  allStoresSelect: any;
  storesToShowInSelect: any;
  selectedStoreAsSender: any;
  previousChatThreadLength: any;
  subscribersArr: Array<any>;

  @ViewChild('scrollMe') private myScrollContainer: ElementRef;

  constructor(
    private db: AngularFireDatabase,
    private chatsService: ChatsService,
    private userService: UserService,
    private datePipe: DatePipe,
    private storeService: StoreService,
    private sanitization: DomSanitizer
  ) {
    this.subscribersArr = [];
    this.previousChatThreadLength = 0;
    this.selectedStoreAsSender = null;
    this.backdropWasClicked = false;
    this.showStoreSelect = false;

    /**
     * Open chat thread
     */
    document.addEventListener('openThreadDialog', (e) => {
      this.selectedStoreAsSender = null;

      if (e['detail']) {
        if (e['detail']['storeId']) {
          this.chatThreadData = {
            storeId: e['detail']['storeId'],
            peerId: e['detail']['peerId']
          }

          this.openChatThread();
        } else {
          /**
           * StoreId was not set
           *
           * Init new chat thread
           */
          this.showStoreSelect = true;
          this.chatThreadData = {
            peerId: e['detail']['peerId']
          }
          this.collectUserStores(this.chatThreadData['peerId']);
        }
        // chatsService.markChatAsRead()
      }

      this.isThreadDialogVisible = true;
    }, false);

    /**
     * Close chat thread
     */
    document.addEventListener('closeThreadDialog', (e) => {
      this.isThreadDialogVisible = false;
      this.chatThreadData = null;
      this.showStoreSelect = false;
      this.chatThread = null;
      this.newMessage = null;
      this.subscribersArr.map(item => item.unsubscribe());
      this.openedChatThreadRef = null;
      this.recipient = null;
    }, false);

  }

  collectUserStores(selectedStore) {
    let userStoresSubscribtion = this.userService.getUserStores().subscribe(data => {
      /**
       * Collect user stores avatars
       */

      let filtered = data.filter(item => {return item['key'] != selectedStore});
      filtered.map(item => {
        this.storeService.getStoreMainavatar(item['key']).subscribe(data => {
          item['thumb'] =data;
        }, err => {
          item['thumb'] = 'http://joappdeals.com/in/wp-content/themes/joapp/images/hanppyuser/default_user.png';
        })
      });

      this.allStoresSelect = filtered;
    });
    this.subscribersArr.push(userStoresSubscribtion);
  }

  pickStoreSender() {
    this.isThreadDialogVisible = true;
    this.showStoreSelect = false;
    this.chatThreadData['storeId'] = this.selectedStoreAsSender;
    this.openChatThread();
  }

  openChatsDialog() {
    this.chatsService.closeThreadDialog();
    this.chatsService.openChatsDialog();
  }

  /**
   * Backdrop was clicked while chatsDialog is active
   */
  onBackdropClicked(event) {
   this.chatsService.closeThreadDialog();
  }

  openChatThread() {
    let storeId = this.chatThreadData['storeId'];
    let peerId = this.chatThreadData['peerId'];

    if (storeId && peerId) {
      let storeValueSubscription = this.storeService.getStoreValue(peerId).subscribe(storeData => {
        this.recipient = {};
        let storeAvatarSubscription = this.storeService.getStoreMainavatar(peerId).subscribe(data => {
          this.recipient.thumb = data;
        }, err => {
          this.recipient.thumb = 'http://joappdeals.com/in/wp-content/themes/joapp/images/happyuser/default_user.png';
        });

        this.subscribersArr.push(storeAvatarSubscription);

        try {
          this.recipient.name = storeData.Settings.data.name || 'Name not provided';
        } catch(e) {
          this.recipient.name = 'Name not provided';
        }
      });

      this.subscribersArr.push(storeValueSubscription);

      this.openedChatThreadRef = this.chatsService.getChatThreadRef(storeId, peerId);

      let chatThreadSubscription = this.chatsService.getChatThread(storeId, peerId).subscribe(data => {
        let sorted = data
          .filter(item => item && item['data'] && item['data']['timestamp'])
          .sort((a: any, b: any) => new Date(a.data.timestamp).getTime() - new Date(b.data.timestamp).getTime())
        this.chatThread = sorted;
        sorted.map(item => {
          this.db.object(`Stores/${this.chatThreadData.storeId}/ChatMessages/${this.chatThreadData.peerId}/${item['fbId']}`).update({
            'data/read': true
          });
        });
      });
      this.subscribersArr.push(chatThreadSubscription);
    }
  }

  removeChatThread() {
    this.chatsService.removeChatThread(this.chatThreadData.storeId, this.chatThreadData.peerId);
    this.openChatsDialog();
  }

  sendMessage() {
    let newMessageRef = this.openedChatThreadRef.push();
    let newMessageKey = newMessageRef.key;
    let now = new Date();
    let time = this.datePipe.transform(now, 'yyyy-MM-ddTHH:mm:ss') + 'Z';

    this.openedChatThreadRef.set(newMessageKey, {
      data: {
        message: this.newMessage,
        outgoing: true,
        peerId: this.chatThreadData.peerId,
        read: false,
        timestamp: time
      },
      direction: 'fbob',
      fbId: newMessageKey,
      storeId: this.chatThreadData.storeId,
      topic: "ob-chatmessages",
      type: "Message_post_ob_chat"
    });

    this.newMessage = null;
  }

  ngOnInit() {
    this.scrollToBottom();
  }

  ngAfterViewChecked() {
    if (this.chatThread && this.chatThread.length && this.chatThread.length != this.previousChatThreadLength) {
      this.scrollToBottom();
      this.previousChatThreadLength = this.chatThread.length
    }
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

}
