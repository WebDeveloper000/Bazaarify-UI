import { Directive, Input, ElementRef, OnChanges, AfterViewInit, SimpleChange, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Directive({
  selector: '[appQrcode]'
})
export class QrcodeDirective {
  @Input() qrcodeData: string;

  constructor(
    private elRef: ElementRef,
    private http: HttpClient
  ) { }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    if (changes['qrcodeData'] && changes['qrcodeData'].currentValue) {
      let data = changes['qrcodeData'].currentValue;
      console.log('QRCODE')
      console.log(data);
      this.loadQrcodeData(data).then(res => {
        this.elRef.nativeElement.src = res;
      }).catch(err => {
        this.elRef.nativeElement.src = ``;
      })

    }
  }

  loadQrcodeData(data) {
    /**
     * Generate qrcode
     */
      if (data) {
        return this.http.post('https://us-central1-bazaarify-97162.cloudfunctions.net/generateQRCode', {'data': data})
          .toPromise()
          .then(data => {
            return  data['qrcodeData'];
          })
      }
  }

}
