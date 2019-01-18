import { Injectable } from '@angular/core';
import { UserService } from 'app/services/user.service';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Subject';
import { combineLatest } from 'rxjs/observable/combineLatest';
// import { concatAll } from 'rxjs/observable/concatAll';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { map, flatMap, switchMap, concatAll, combineAll } from 'rxjs/operators';
import { fromPromise } from 'rxjs/observable/fromPromise';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class ChatsService {
  private chats: any;
  private unreadMessagesCount: any;

  constructor(
    private db: AngularFireDatabase,
    private userService: UserService
  ) {
    this.chats = new Subject;
    this.unreadMessagesCount = new Subject;

    this.setChats();
    this.setUnreadMessagesCount();
  }

  /**
   * Chats
   */
  openChatsDialog() {
    let event = new CustomEvent('openChatsDialog');
    document.dispatchEvent(event);
  }

  closeChatsDialog() {
    let event = new CustomEvent('closeChatsDialog');
    document.dispatchEvent(event);
  }

  /**
   *  Chat thread
   */
  openThreadDialog(storeId, peerId) {
    let event = new CustomEvent('openThreadDialog', {'detail': {
      storeId,
      peerId
    }});
    document.dispatchEvent(event);
  }

  closeThreadDialog() {
    let event = new CustomEvent('closeThreadDialog');
    document.dispatchEvent(event);
  }


  setChats() {
    let formated = [];

    this.chats = this.userService.getUserStores().switchMap(stores => {
      if (stores && stores.length) {
        let chatsObservables = [];
        stores.map(store => {
          chatsObservables.push(this.db.list(`Stores/${store['key']}/ChatMessages`, ref => ref.orderByChild('data/timestamp')).snapshotChanges());
        });
        return Observable.combineLatest(
          chatsObservables,
          /**
           * Use this project function to modify the combined value. To flatten the arrays into a single array.
           */
          (...arrays) => arrays.reduce((acc, array) => [...acc, ...array], [])

        ).map(data => {
          let chatsSorted = [];
          data.map(item => {
            let data = item.payload.val();
            let messages = Object.keys(data).map(key => data[key]);
            let sorted = messages
            /**
             * Messages should have those fields
             */
              .filter(item => item && item['data'] && item['data']['timestamp'])
              /**
               * The last messages goes at the bottom
               */
              .sort((a: any, b: any) => new Date(a.data.timestamp).getTime() - new Date(b.data.timestamp).getTime())

            if (sorted && sorted.length) {
              /**
               * Collect stores info user has chats with
               */
              let senderId = sorted[sorted.length - 1]['storeId'];
              let recipientId = sorted[sorted.length - 1]['data']['peerId'];

              chatsSorted.push({
                'key': item['key'],
                'messages': sorted,
                'storeId': senderId,
                'peerId': recipientId,
                'lastMessage': sorted[sorted.length - 1]['data']['message'],
                'lastMessageMine':  sorted[sorted.length - 1]['data']['outgoing'],
                'showUnreadMark': ! sorted[sorted.length - 1]['data']['outgoing'] && ! (sorted[sorted.length - 1]['data']['read'])
              });
            }
          });

          return chatsSorted;
        });
      } else {
        return Observable.of([]);
      }

    });
  }

  // TODO combineLatest doesnt fire when node is NULL!!!
  setUnreadMessagesCount() {
    this.getChats().subscribe(data => {
      let counter = 0;
        data.map(chat => {
          let lastMessage = chat['messages'][chat['messages'].length -1];
          if (! lastMessage['data']['read'] && ! lastMessage['data']['outgoing']){
            counter +=1;
          }
        });
        this.unreadMessagesCount.next(counter);
      });
  }

  getChats() {
    return this.chats;
  }

  getChatThread(storeId, chatThreadId) {
    return this.db.list(`Stores/${storeId}/ChatMessages/${chatThreadId}`).valueChanges();
  }

  getChatThreadRef(storeId, chatThreadId) {
    return this.db.list(`Stores/${storeId}/ChatMessages/${chatThreadId}`, ref => ref.orderByChild('data/timestamp'));
  }



  getUnreadMessagesCount() {
    return this.unreadMessagesCount;
  }

  removeChatThread(storeId, peerId) {
    this.db.object(`Stores/${storeId}/ChatMessages/${peerId}`).set(null);
  }


  clearUnreadChats() {
    return new Promise((resolve, reject) => {
      // this.getChats().then(chats => {
      //   let counter = 0;
      //   chats.map(chat => {
      //     if (! chat['data']['read']) {
      //       this.markChatAsRead(chat);
      //     }
      //   });
      //   return resolve(counter);
      // });
    });
  }

  markChatAsRead(chat) {
    chat['data']['read'] = true;
    let chatRef = this.db.object(`Stores/${chat.storeId}/ChatMessages/${chat.data.timestamp}_${chat.data.messageId}`);
    chatRef.update(
      {
        "data/read": true,
        "direction": "fbob"
      }
    );
  }


}
