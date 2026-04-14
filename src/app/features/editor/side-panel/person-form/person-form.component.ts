import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Divider } from "primeng/divider";
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';
import { AccordionComponent } from '../../../../shared/accordion/accordion.component';
import { FuzzyDatePickerComponent } from '../../../../shared/persons/fuzzy-date-picker/fuzzy-date-picker.component';
import { FuzzyDateInput, Gender } from '../../../../shared/persons/person.model';
import { PersonsStore } from '../../../../shared/persons/persons.store';
import { SidePanelService } from '../side-panel.service';

interface GenderOption {
  label: string;
  value: Gender;
}

@Component({
  selector: 'app-person-form',
  imports: [FormsModule, ButtonModule, InputTextModule, SelectModule, TextareaModule, FuzzyDatePickerComponent, Divider, AccordionComponent],
  templateUrl: './person-form.component.html',
  styleUrl: './person-form.component.scss',
})
export class PersonFormComponent implements OnInit {
  private readonly personsStore = inject(PersonsStore);
  private readonly sidePanelService = inject(SidePanelService);

  readonly personId = input<string | null>(null);

  readonly saving = signal(false);

  readonly title = signal('');
  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly middleNames = signal('');
  readonly birthName = signal('');
  readonly gender = signal<Gender | null>(null);
  readonly birthPlace = signal('');
  readonly birthDate = signal<FuzzyDateInput | null>(null);
  readonly deathPlace = signal('');
  readonly deathDate = signal<FuzzyDateInput | null>(null);
  readonly burialPlace = signal('');
  readonly religion = signal('');
  readonly notes = signal('');

  ngOnInit(): void {
    const id = this.personId();
    if (!id) return;
    const p = this.personsStore.persons().find((x) => x.id === id);
    if (!p) return;
    this.title.set(p.title ?? '');
    this.firstName.set(p.firstName);
    this.lastName.set(p.lastName);
    this.middleNames.set(p.middleNames ?? '');
    this.birthName.set(p.birthName ?? '');
    this.gender.set(p.gender ?? null);
    this.birthPlace.set(p.birthPlace ?? '');
    this.birthDate.set(p.birthDate ? { precision: p.birthDate.precision, date: p.birthDate.date, dateTo: p.birthDate.dateTo, note: p.birthDate.note } : null);
    this.deathPlace.set(p.deathPlace ?? '');
    this.deathDate.set(p.deathDate ? { precision: p.deathDate.precision, date: p.deathDate.date, dateTo: p.deathDate.dateTo, note: p.deathDate.note } : null);
    this.burialPlace.set(p.burialPlace ?? '');
    this.religion.set(p.religion ?? '');
    this.notes.set(p.notes ?? '');
  }

  readonly genderOptions: GenderOption[] = [
    { label: 'Männlich', value: 'male' },
    { label: 'Weiblich', value: 'female' },
    { label: 'Divers', value: 'diverse' },
  ];

  readonly religionOptions: string[] = [
    'Römisch-Katholisch',
    'Evangelisch',
    'Evangelisch-Lutherisch',
    'Evangelisch-Reformiert',
    'Orthodox',
    'Islam',
    'Judentum',
    'Buddhismus',
    'Hinduismus',
    'Konfessionslos',
  ];

  get isValid(): boolean {
    return this.firstName().trim().length > 0 && this.lastName().trim().length > 0;
  }

  private buildInput() {
    return {
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      ...(this.title().trim() && { title: this.title().trim() }),
      ...(this.middleNames().trim() && { middleNames: this.middleNames().trim() }),
      ...(this.birthName().trim() && { birthName: this.birthName().trim() }),
      ...(this.gender() && { gender: this.gender()! }),
      ...(this.birthPlace().trim() && { birthPlace: this.birthPlace().trim() }),
      ...(this.birthDate() && { birthDate: this.birthDate()! }),
      ...(this.deathPlace().trim() && { deathPlace: this.deathPlace().trim() }),
      ...(this.deathDate() && { deathDate: this.deathDate()! }),
      ...(this.burialPlace().trim() && { burialPlace: this.burialPlace().trim() }),
      ...(this.religion().trim() && { religion: this.religion().trim() }),
      ...(this.notes().trim() && { notes: this.notes().trim() }),
    };
  }

  onSubmit(): void {
    if (!this.isValid) return;

    const id = this.personId();
    this.saving.set(true);

    const op$ = id
      ? this.personsStore.update(id, this.buildInput())
      : this.personsStore.create(this.buildInput());

    op$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (person) => this.sidePanelService.open({ type: 'person-detail', personId: person.id }),
    });
  }

  onCancel(): void {
    const id = this.personId();
    if (id) {
      this.sidePanelService.open({ type: 'person-detail', personId: id });
    } else {
      this.sidePanelService.close();
    }
  }
}
