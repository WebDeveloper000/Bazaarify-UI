import { Directive, Input, ElementRef, OnChanges, AfterViewInit, SimpleChange, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Directive({
  selector: '[appUsdToBtc]'
})
export class UsdToBtcDirective {
  @Input() usd: string;

  constructor(
    private elRef: ElementRef,
    private http: HttpClient
  ) {
  }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    if (changes['usd'] && changes['usd'].currentValue) {
      let usd = changes['usd'].currentValue;
      this.convertValue(usd).then(res => {
        this.elRef.nativeElement.textContent = `$${usd} / ${res} BTC`;
      }).catch(err => {
        this.elRef.nativeElement.textContent = `$${usd} / Error occured while converting to BTC`;
      })
    }
  }

  convertValue(usd) {
    return this.http.get('https://bitpay.com/rates/btc/usd')
      .toPromise()
      .then(res => {
        let rates = res['data'];
        if (rates) {
          return parseFloat( (usd / rates['rate']).toFixed(6) );
        }
        throw new Error();
      })
  }

}
