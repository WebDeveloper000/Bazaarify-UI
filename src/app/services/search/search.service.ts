import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Subject';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { StoreService } from '../store/store.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, flatMap, switchMap, concatAll, combineAll } from 'rxjs/operators';
import { RequestOptions } from '@angular/http';

@Injectable()
export class SearchService {
  // OBsearchURL: string = 'https://search.ob1.io/search/listings'
  /**
   * Based on
   * https://blockbooth.com/about/
   * @type {string}
   */
  OBsearchURL: string = 'https://search.blockbooth.com/api'

  constructor(
    private db: AngularFireDatabase,
    private storeService: StoreService,
    private http: HttpClient
  ) { }

  /**
   * Chats
   */
  openSearchDialog(searchConfiguration) {
    let event = new CustomEvent('openSearchDialog', {'detail': {
      searchConfiguration: searchConfiguration
    }});
    document.dispatchEvent(event);
  }

  closeSearchDialog() {
    let event = new CustomEvent('closeSearchDialog');
    document.dispatchEvent(event);
  }

  storesSearch(searchTerm) {
    return this.http.post('https://us-central1-bazaarify-97162.cloudfunctions.net/searchStoreBySearchTerm', { searchTerm }).switchMap(data => {
      let results = data['results'];

      if (results && results.length) {
        let obsArr = [];
        results.map(store => {
          obsArr.push( this.storeService.getStoreSnapshot(store['storeId']) )
        });

        return Observable.combineLatest(
          obsArr,
          /**
           * Use this project function to modify the combined value. To flatten the arrays into a single array.
           */
          (...arrays) => arrays.reduce((acc, array) => [...acc, ...array], [] )
        ).map(res => {
          return {'stores': res}
        })
      } else {
        return Observable.of({'stores': []});
      }
    })
  }

  listingSearch(searchTerm, page) {
    return this.http.get(`${this.OBsearchURL}?q=${searchTerm}&p=${page}`).map(data => {
      let productsObservable = [];
      let headers = new HttpHeaders();
      headers.append("Authorization", "Basic T0JTZWFyY2hOb2RlOm9wZW4xQEJ6ZlNob3A5ODc2");
      // data['results']['results'].map(item => {
      //   this.http.get(`http://35.231.115.253:4002/ipfs/zb2rhhirS3ZuT4q71HBZpXikNxYDpcBMufFXtdR2whdNsUhQo`, {headers}).subscribe(img => {
      //     console.log('KEK');
      //     console.log(img);
      //   })
      // });


      if (data && data['results'] && (data['results']['total'] > 0)) {
        let headers = new HttpHeaders();
        headers.append("Authorization", "Basic T0JTZWFyY2hOb2RlOm9wZW4xQEJ6ZlNob3A5ODc2");
        // headers.append("Content-Type", "application/x-www-form-urlencoded");
        headers.append("responseType", "text");
        // let options = new RequestOptions({ headers: headers });
        //
        // data['results']['results'].map(item => {
        //   this.http.get(`http://35.231.115.253:4002/ipfs/${item['data']['thumbnail']['medium']}`,
        //     {
        //       headers: new HttpHeaders({
        //         'Authorization': 'Basic T0JTZWFyY2hOb2RlOm9wZW4xQEJ6ZlNob3A5ODc2',
        //         'responseType': 'arraybuffer'
        //       })
        //     }
        //   ).subscribe(img => {
        //     console.log('KEK');
        //     console.log(img);
        //   })
        // });
        console.log(data);
        console.log('LISTINGS RESULTS');
        return {
          'listings': data
        };

      } else {
        return {'listings': []};
      }
    })
  }

  discovery(pageNumber): Observable<any> {
    return this.http.get(`${this.OBsearchURL}?p=${pageNumber}`);
  }

  // search(searchTerm): Observable<any> {
  //   return Observable.combineLatest(
  //     [
  //       this.storesSearch(searchTerm),
  //       this.listingSearch(searchTerm)
  //     ]);
  // }
}
