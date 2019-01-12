import { Component, OnInit } from '@angular/core';
import { SearchService } from 'app/services/search/search.service';
import { DomSanitizer }from '@angular/platform-browser';

@Component({
  selector: 'app-discovery',
  templateUrl: './discovery.component.html',
  styleUrls: ['./discovery.component.scss']
})
export class DiscoveryComponent implements OnInit {
  searchResults: Array<any> = [];
  showSpinner: Boolean = false;
  currentListingsPage: number = 1;
  moreListingsToLoadFound: Boolean = false;
  constructor(
    private searchService: SearchService,
    private sanitization: DomSanitizer,
  ) {
    this.loadDiscoveryResults();
  }

  loadDiscoveryResults() {
    this.showSpinner = true;

    this.searchService.discovery(this.currentListingsPage).subscribe(data => {
      if (data['results']) {
        this.moreListingsToLoadFound = data['results']['morePages'];

        // For listings
        this.searchResults.push(...data['results']['results'].map(item => {
          // let thumb = `url(http://35.231.115.253:4002/ipfs/${item.data.thumbnail.medium})`;
          let thumb = `http://35.231.115.253:4002/ipfs/${item.data.thumbnail.medium}`;
          item['thumb'] = thumb;
          return item;
        }));
      }

      this.showSpinner = false;
    })
  }

  loadMoreListings() {
    this.currentListingsPage += 1;
    this.loadDiscoveryResults();
  }

  ngOnInit() {
  }

}
