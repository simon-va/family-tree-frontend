import { Pipe, PipeTransform } from '@angular/core';
import { FuzzyDate, FuzzyDateFieldPrecision } from './person.model';

@Pipe({ name: 'fuzzyDate', standalone: true })
export class FuzzyDatePipe implements PipeTransform {
  transform(value: Omit<FuzzyDate, 'id'> | undefined | null): string {
    if (!value) return '—';

    const dateFieldPrecision = this.resolveFieldPrecision(value.precision, value.datePrecision);
    const dateToFieldPrecision = this.resolveFieldPrecision(value.precision, value.dateToPrecision);

    const formatted = this.formatDate(value.date, dateFieldPrecision);
    const formattedTo = value.dateTo ? this.formatDate(value.dateTo, dateToFieldPrecision) : null;

    switch (value.precision) {
      case 'exact':
        return formatted;
      case 'month':
        return formatted;
      case 'year':
        return formatted;
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

  private resolveFieldPrecision(
    precision: FuzzyDate['precision'],
    fieldPrecision: FuzzyDateFieldPrecision | undefined,
  ): FuzzyDateFieldPrecision {
    if (precision === 'exact') return 'exact';
    if (precision === 'month') return 'month';
    if (precision === 'year') return 'year';
    return fieldPrecision ?? 'exact';
  }

  private formatDate(dateStr: string, precision: FuzzyDateFieldPrecision): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    switch (precision) {
      case 'exact':
        return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
      case 'month':
        return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
      case 'year':
        return String(date.getFullYear());
    }
  }
}
