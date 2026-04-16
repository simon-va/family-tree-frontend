import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { finalize } from 'rxjs';
import { AccordionComponent } from '../../../../shared/accordion/accordion.component';
import { FuzzyDatePickerComponent } from '../../../../shared/persons/fuzzy-date-picker/fuzzy-date-picker.component';
import { FuzzyDateInput } from '../../../../shared/persons/person.model';
import { ResidencesStore } from '../../../../shared/residences/residences.store';
import { SidePanelService } from '../side-panel.service';
import { COUNTRY_OPTIONS } from '../../../../shared/residences/residence.model';
import { ResidenceMapDialogComponent } from '../residence-map-dialog/residence-map-dialog.component';

@Component({
  selector: 'app-residence-form',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, SelectModule, Textarea, FuzzyDatePickerComponent, Divider, AccordionComponent, ResidenceMapDialogComponent],
  templateUrl: './residence-form.component.html',
  styleUrl: './residence-form.component.scss',
})
export class ResidenceFormComponent implements OnInit {
  private readonly residencesStore = inject(ResidencesStore);
  private readonly sidePanelService = inject(SidePanelService);

  readonly personId = input<string | null>(null);
  readonly residenceId = input<string | null>(null);

  readonly saving = signal(false);
  readonly showMapDialog = signal(false);

  readonly street = signal('');
  readonly city = signal('');
  readonly country = signal('');
  readonly notes = signal('');
  readonly lat = signal<number | null>(null);
  readonly lng = signal<number | null>(null);
  readonly startDate = signal<FuzzyDateInput | null>(null);
  readonly endDate = signal<FuzzyDateInput | null>(null);

  private resolvedPersonId: string | null = null;

  readonly countryOptions = COUNTRY_OPTIONS;

  openMapDialog(): void {
    this.showMapDialog.set(true);
  }

  onMapCoordsSelected(coords: { lat: number; lng: number }): void {
    this.lat.set(coords.lat);
    this.lng.set(coords.lng);
  }

  ngOnInit(): void {
    const rid = this.residenceId();
    if (rid) {
      const r = this.residencesStore.residences().find((x) => x.id === rid);
      if (r) {
        this.resolvedPersonId = r.personId;
        this.street.set(r.street ?? '');
        this.city.set(r.city ?? '');
        this.country.set(r.country ?? '');
        this.notes.set(r.notes ?? '');
        this.lat.set(r.lat ?? null);
        this.lng.set(r.lng ?? null);
        this.startDate.set(r.startDate ? { precision: r.startDate.precision, date: r.startDate.date, dateTo: r.startDate.dateTo, note: r.startDate.note } : null);
        this.endDate.set(r.endDate ? { precision: r.endDate.precision, date: r.endDate.date, dateTo: r.endDate.dateTo, note: r.endDate.note } : null);
      }
    } else {
      this.resolvedPersonId = this.personId();
    }
  }

  get isValid(): boolean {
    return this.city().trim().length > 0 || this.street().trim().length > 0 || this.country().trim().length > 0;
  }

  private buildInput() {
    return {
      personId: this.resolvedPersonId!,
      ...(this.street().trim() && { street: this.street().trim() }),
      ...(this.city().trim() && { city: this.city().trim() }),
      ...(this.country().trim() && { country: this.country().trim() }),
      ...(this.notes().trim() && { notes: this.notes().trim() }),
      ...(this.lat() != null && { lat: this.lat()! }),
      ...(this.lng() != null && { lng: this.lng()! }),
      ...(this.startDate() && { startDate: this.startDate()! }),
      ...(this.endDate() && { endDate: this.endDate()! }),
    };
  }

  onSubmit(): void {
    if (!this.isValid || !this.resolvedPersonId) return;

    const rid = this.residenceId();
    this.saving.set(true);

    const op$ = rid
      ? this.residencesStore.update(rid, this.buildInput())
      : this.residencesStore.create(this.buildInput());

    op$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => this.sidePanelService.open({ type: 'person-detail', personId: this.resolvedPersonId! }),
    });
  }

  onCancel(): void {
    if (this.resolvedPersonId) {
      this.sidePanelService.open({ type: 'person-detail', personId: this.resolvedPersonId });
    } else {
      this.sidePanelService.close();
    }
  }
}
