import { Component, computed, inject, input } from '@angular/core';
import { Person } from '../../../../shared/persons/person.model';
import { PersonsStore } from '../../../../shared/persons/persons.store';
import { ResidenceLocationEntry } from '../../../../shared/residences/residence.model';
import { SidePanelService } from '../side-panel.service';

export interface LocationView {
  address: string;
  persons: { person: Person; residenceId: string }[];
}

@Component({
  selector: 'app-residence-location',
  standalone: true,
  imports: [],
  templateUrl: './residence-location.component.html',
  styleUrl: './residence-location.component.scss',
})
export class ResidenceLocationComponent {
  readonly locations = input.required<ResidenceLocationEntry[]>();

  private readonly personsStore = inject(PersonsStore);
  private readonly sidePanelService = inject(SidePanelService);

  readonly locationViews = computed<LocationView[]>(() => {
    const allPersons = this.personsStore.persons();
    return this.locations().map((entry) => {
      const r0 = entry.residences[0];
      const parts = r0 ? [r0.street, r0.city, r0.country].filter(Boolean) : [];
      const address = parts.length > 0 ? parts.join(', ') : 'Unbekannter Ort';

      const seen = new Set<string>();
      const persons: { person: Person; residenceId: string }[] = [];
      for (const r of entry.residences) {
        if (!seen.has(r.personId)) {
          seen.add(r.personId);
          const person = allPersons.find((p) => p.id === r.personId);
          if (person) persons.push({ person, residenceId: r.id });
        }
      }
      return { address, persons };
    });
  });

  openPersonDetail(personId: string, residenceId: string): void {
    this.sidePanelService.open({ type: 'person-detail', personId, residenceId });
  }
}
