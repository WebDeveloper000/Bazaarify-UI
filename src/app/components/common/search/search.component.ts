import { Component, OnInit } from '@angular/core';
import { SearchService } from '../../../services/search/search.service';
import { StoreService } from '../../../services/store/store.service';
import { DomSanitizer }from '@angular/platform-browser';
import { ChatsService } from 'app/services/chats/chats.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  private isSearchActive: Boolean;
  private searchTerm: String;
  private results: Object = {
    'stores': [],
    'listings': []
  };
  storesAreLoading: Boolean = false;
  listingsAreLoading: Boolean = false;
  showSpinner: Boolean = false;
  searchResultsFilter: string = 'all';
  currentListingsPage: number = 0;
  moreListingsToLoadFound: Boolean = false;
  constructor(
    private searchService: SearchService,
    private storeService: StoreService,
    private sanitization: DomSanitizer,
    private chatsService: ChatsService
  ) {

    this.isSearchActive = false;

    document.addEventListener('openSearchDialog', (e) => {
      this.showSpinner = true;

      if (e['detail']) {
        this.searchTerm = e['detail']['searchConfiguration']['searchTerm'];
        this.searchResultsFilter = e['detail']['searchConfiguration']['searchResultsFilter'];
      }
      this.loadStores();
      this.loadListings();
      this.isSearchActive = true;

    }, false);

    document.addEventListener('closeThreadDialog', (e) => {
      this.isSearchActive = false;
    }, false);
  }

  loadStores() {
    this.storesAreLoading = true;

    this.searchService.storesSearch(this.searchTerm).subscribe(data => {
      let storesFound = data['stores'];
      // For stores
      this.results['stores'] = storesFound.map(item => {
        let key = item['key'];
        let storeData = item.payload.val();

        this.storeService.getStoreMainavatar(key).subscribe(data => {
          storeData.thumb = data;
        })

        return {
          'key': key,
          'data': storeData
        }
      });

      this.storesAreLoading = false;
    });
  }

  loadListings() {
    this.listingsAreLoading = true;

    this.searchService.listingSearch(this.searchTerm, this.currentListingsPage).subscribe(data => {
      /**
       * Load more listings button
       */
      if (data['listings'] && data['listings']['results']) {
        this.moreListingsToLoadFound = data['listings']['results']['morePages'];

        let listingsFound = data['listings'];
        // For listings
        this.results['listings'].push(...listingsFound['results']['results'].map(item => {
          // let thumb = `url(http://35.231.115.253:4002/ipfs/${item.data.thumbnail.medium})`;
          let thumb = `http://35.231.115.253:4002/ipfs/${item.data.thumbnail.medium}`;
          item['thumb'] = thumb;
          return item;
        }));
      }

      this.listingsAreLoading = false;
    });
  }

  ngOnInit() {
  }

  /**
   * Backdrop was clicked while chatsDialog is active
   */
  onBackdropClicked(event) {
    this.searchTerm = '';
    this.searchResultsFilter = 'all';
    this.results = {
      'stores': [],
      'listings': []
    };
    this.listingsAreLoading = false;
    this.storesAreLoading = false;
    this.isSearchActive = false;
  }

  openThread(peerId) {
    this.searchTerm = '';
    this.searchResultsFilter = 'all';
    this.results = {
      'stores': [],
      'listings': []
    };
    this.listingsAreLoading = false;
    this.storesAreLoading = false;
    this.isSearchActive = false;
    this.chatsService.openThreadDialog(null, peerId);
  }

  toggleSearchResultsFilter(filterValue) {
    this.searchResultsFilter = filterValue;
  }

  loadMoreListings() {
    this.currentListingsPage += 1;
    this.loadListings();
  }

}
