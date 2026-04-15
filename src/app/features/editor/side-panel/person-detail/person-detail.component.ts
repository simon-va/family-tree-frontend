import { Component, computed, inject, input, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { Divider } from 'primeng/divider';
import { FuzzyDatePipe } from '../../../../shared/persons/fuzzy-date.pipe';
import { GenderPipe } from '../../../../shared/persons/gender.pipe';
import { Person } from '../../../../shared/persons/person.model';
import { PersonsStore } from '../../../../shared/persons/persons.store';
import { Residence } from '../../../../shared/residences/residence.model';
import { ResidencesStore } from '../../../../shared/residences/residences.store';
import { SidePanelService } from '../side-panel.service';

@Component({
  selector: 'app-person-detail',
  standalone: true,
  imports: [GenderPipe, FuzzyDatePipe, ButtonModule, ConfirmPopupModule, Divider],
  templateUrl: './person-detail.component.html',
  styleUrl: './person-detail.component.scss',
})
export class PersonDetailComponent {
  readonly person = input.required<Person>();

  private readonly personsStore = inject(PersonsStore);
  private readonly residencesStore = inject(ResidencesStore);
  private readonly sidePanelService = inject(SidePanelService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly confirmDelete = signal(false);

  readonly personResidences = computed(() =>
    this.residencesStore.residences().filter((r) => r.personId === this.person().id),
  );

  formatAddress(residence: Residence): string {
    return [residence.street, residence.city, residence.country].filter(Boolean).join(', ');
  }

  openResidenceForm(): void {
    this.sidePanelService.open({ type: 'residence-form', personId: this.person().id });
  }

  onEditResidence(residenceId: string): void {
    this.sidePanelService.open({ type: 'residence-edit', residenceId });
  }

  onDeleteResidence(event: Event, residenceId: string): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Wohnort wirklich löschen?',
      accept: () => this.residencesStore.delete(residenceId),
    });
  }

  onEdit(): void {
    this.sidePanelService.open({ type: 'person-edit', personId: this.person().id });
  }

  onDeleteRequest(): void {
    this.confirmDelete.set(true);
  }

  onDeleteCancel(): void {
    this.confirmDelete.set(false);
  }

  onDeleteConfirm(): void {
    const persons = this.personsStore.persons();
    const idx = persons.findIndex((p) => p.id === this.person().id);

    if (persons.length === 1) {
      this.sidePanelService.close();
    } else {
      const next = persons[idx > 0 ? idx - 1 : 1];
      this.sidePanelService.open({ type: 'person-detail', personId: next.id });
    }

    this.personsStore.delete(this.person().id);
    this.confirmDelete.set(false);
  }
}
