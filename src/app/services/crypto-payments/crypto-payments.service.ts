import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class CryptoPaymentsService {

  constructor(
    private http: HttpClient
  ) { }

  /**
   *
   * @param baseCurrency: string
   * @param targetCurrency: string
   * @returns {any}
   */
  getRate(targetCurrency: string = 'btc') {
    return this.http.get(`https://bitpay.com/rates/${targetCurrency}/usd`)
  }

  convertUsdTo(usdAmount, targetCurrency) {
    return this.getRate(targetCurrency)
      .toPromise()
      .then(res => {
        let rates = res['data'];
        console.log(rates);
        if (rates) {
          return parseFloat( (usdAmount / rates['rate']).toFixed(6) );
        }
        throw new Error();
      })
  }

}
