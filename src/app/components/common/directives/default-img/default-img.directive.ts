import { Directive, Input } from '@angular/core';

@Directive({
  selector: 'img[src]',
  host: {
    '[src]': 'checkPath(src)',
    '(error)': 'onError()'
  }
})

export class DefaultImgDirective {
  @Input() src: string;
  constructor() { }

  public defaultImg: string = 'https://www.coastalliving.com/img/icons/missing-image-16x9.svg';

  public onError() {
    this.src = this.defaultImg;
  }

  public checkPath(src) {
    return src ? src : this.defaultImg;
  }
}
