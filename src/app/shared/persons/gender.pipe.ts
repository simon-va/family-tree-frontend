import { Pipe, PipeTransform } from '@angular/core';
import { Gender } from './person.model';

@Pipe({ name: 'gender', standalone: true })
export class GenderPipe implements PipeTransform {
  transform(value: Gender | undefined): string {
    switch (value) {
      case 'male':
        return 'Männlich';
      case 'female':
        return 'Weiblich';
      case 'diverse':
        return 'Divers';
      default:
        return '—';
    }
  }
}
