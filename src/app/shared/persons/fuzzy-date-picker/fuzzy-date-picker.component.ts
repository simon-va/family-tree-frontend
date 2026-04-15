import { Component, computed, input, model, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { Popover, PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FuzzyDatePipe } from '../fuzzy-date.pipe';
import type { FuzzyDatePrecision } from '../person.model';
import { FuzzyDateInput } from '../person.model';

type PickerPrecision = 'exact' | 'month' | 'year';

interface PrecisionOption {
  label: string;
  value: FuzzyDatePrecision;
}

interface PickerPrecisionOption {
  label: string;
  value: PickerPrecision;
}

@Component({
  selector: 'app-fuzzy-date-picker',
  imports: [FormsModule, ButtonModule, InputTextModule, DatePickerModule, SelectModule, SelectButtonModule, PopoverModule, FuzzyDatePipe],
  templateUrl: './fuzzy-date-picker.component.html',
  styleUrl: './fuzzy-date-picker.component.scss',
})
export class FuzzyDatePickerComponent {
  readonly value = model<FuzzyDateInput | null>(null);
  readonly disabled = input(false);

  private readonly popover = viewChild.required<Popover>('op');

  readonly draftPrecision = signal<FuzzyDatePrecision>('exact');
  readonly draftDate = signal<Date | null>(null);
  readonly draftDateTo = signal<Date | null>(null);
  readonly draftNote = signal('');

  readonly pickerPrecisionDate = signal<PickerPrecision>('year');
  readonly pickerPrecisionDateTo = signal<PickerPrecision>('year');

  readonly showDateTo = computed(() => this.draftPrecision() === 'between');

  readonly canApply = computed(() => {
    if (!this.draftDate()) return false;
    if (this.draftPrecision() === 'between' && !this.draftDateTo()) return false;
    return true;
  });

  readonly showPickerPrecision = computed(() => {
    const p = this.draftPrecision();
    return p !== 'exact' && p !== 'month' && p !== 'year';
  });

  readonly datePickerView = computed<'date' | 'month' | 'year'>(() => {
    const p = this.draftPrecision();
    if (p === 'exact') return 'date';
    if (p === 'month') return 'month';
    if (p === 'year') return 'year';
    return this.toPickerView(this.pickerPrecisionDate());
  });

  readonly datePickerViewTo = computed<'date' | 'month' | 'year'>(() => {
    const p = this.draftPrecision();
    if (p === 'exact') return 'date';
    if (p === 'month') return 'month';
    if (p === 'year') return 'year';
    return this.toPickerView(this.pickerPrecisionDateTo());
  });

  readonly datePickerFormat = computed(() => {
    const p = this.draftPrecision();
    if (p === 'exact') return 'dd.mm.yy';
    if (p === 'month') return 'mm/yy';
    if (p === 'year') return 'yy';
    return this.toPickerFormat(this.pickerPrecisionDate());
  });

  readonly datePickerFormatTo = computed(() => {
    const p = this.draftPrecision();
    if (p === 'exact') return 'dd.mm.yy';
    if (p === 'month') return 'mm/yy';
    if (p === 'year') return 'yy';
    return this.toPickerFormat(this.pickerPrecisionDateTo());
  });

  readonly precisionOptions: PrecisionOption[] = [
    { label: 'Genaues Datum', value: 'exact' },
    { label: 'Monat', value: 'month' },
    { label: 'Jahr', value: 'year' },
    { label: 'Geschätzt', value: 'estimated' },
    { label: 'Vor', value: 'before' },
    { label: 'Nach', value: 'after' },
    { label: 'Zwischen', value: 'between' },
  ];

  readonly pickerPrecisionOptions: PickerPrecisionOption[] = [
    { label: 'Tag', value: 'exact' },
    { label: 'Mon.', value: 'month' },
    { label: 'Jahr', value: 'year' },
  ];

  openPopover(event: MouseEvent): void {
    const current = this.value();
    const precision = current?.precision ?? 'exact';
    this.draftPrecision.set(precision);
    this.pickerPrecisionDate.set(current?.datePrecision ?? this.precisionToPickerPrecision(precision));
    this.pickerPrecisionDateTo.set(current?.dateToPrecision ?? 'year');
    this.draftDate.set(this.stringToDate(current?.date ?? ''));
    this.draftDateTo.set(this.stringToDate(current?.dateTo ?? ''));
    this.draftNote.set(current?.note ?? '');
    this.popover().toggle(event);
  }

  setPrecision(precision: FuzzyDatePrecision): void {
    this.draftPrecision.set(precision);
    this.draftDate.set(null);
    this.draftDateTo.set(null);
    this.pickerPrecisionDate.set('year');
    this.pickerPrecisionDateTo.set('year');
  }

  setPickerPrecisionDate(p: PickerPrecision): void {
    this.pickerPrecisionDate.set(p);
    this.draftDate.set(null);
  }

  setPickerPrecisionDateTo(p: PickerPrecision): void {
    this.pickerPrecisionDateTo.set(p);
    this.draftDateTo.set(null);
  }

  apply(): void {
    const precision = this.draftPrecision();
    const date = this.dateToString(this.draftDate());
    if (!date) return;

    const result: FuzzyDateInput = { precision, date };
    if (this.showPickerPrecision()) {
      result.datePrecision = this.pickerPrecisionDate();
    }
    if (precision === 'between') {
      const dateTo = this.dateToString(this.draftDateTo());
      if (dateTo) {
        result.dateTo = dateTo;
        result.dateToPrecision = this.pickerPrecisionDateTo();
      }
    }
    if (this.draftNote().trim()) {
      result.note = this.draftNote().trim();
    }

    this.value.set(result);
    this.popover().hide();
  }

  clear(): void {
    this.value.set(null);
    this.popover().hide();
  }

  private precisionToPickerPrecision(precision: FuzzyDatePrecision): PickerPrecision {
    if (precision === 'exact') return 'exact';
    if (precision === 'month') return 'month';
    return 'year';
  }

  private toPickerView(p: PickerPrecision): 'date' | 'month' | 'year' {
    if (p === 'exact') return 'date';
    if (p === 'month') return 'month';
    return 'year';
  }

  private toPickerFormat(p: PickerPrecision): string {
    if (p === 'exact') return 'dd.mm.yy';
    if (p === 'month') return 'mm/yy';
    return 'yy';
  }

  private stringToDate(str: string): Date | null {
    if (!str) return null;
    return new Date(str);
  }

  private dateToString(date: Date | null): string {
    if (!date) return '';
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
  }
}
