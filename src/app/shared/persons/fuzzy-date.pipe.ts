import { Pipe, PipeTransform } from '@angular/core';
import { FuzzyDate } from './person.model';

@Pipe({ name: 'fuzzyDate', standalone: true })
export class FuzzyDatePipe implements PipeTransform {
  transform(value: Omit<FuzzyDate, 'id'> | undefined | null): string {
    if (!value) return '—';

    const formatted = this.formatDate(value.date, value.precision);
    const formattedTo = value.dateTo ? this.formatDate(value.dateTo, 'year') : null;

    switch (value.precision) {
      case 'exact':
        return formatted;
      case 'month':
        return formatted;
      case 'year':
        return formatted;
      case 'about':
        return `um ${formatted}`;
      case 'estimated':
        return `ca. ${formatted}`;
      case 'before':
        return `vor ${formatted}`;
      case 'after':
        return `nach ${formatted}`;
      case 'between':
        return formattedTo ? `zwischen ${formatted} und ${formattedTo}` : formatted;
      default:
        return formatted;
    }
  }

  private formatDate(dateStr: string, precision: FuzzyDate['precision']): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    switch (precision) {
      case 'exact':
        return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
      case 'month':
        return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
      default:
        return String(date.getFullYear());
    }
  }
}
