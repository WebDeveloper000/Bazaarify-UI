import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'getExcerpt'})
export class GetExcerptPipe implements PipeTransform {
  transform(value: string): string {
    return value ? (value.substring(0, 180) + '...') : 'Not provided';
  }
}
