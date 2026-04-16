import { Component, computed, inject, input } from '@angular/core';
import { Person } from '../../../../shared/persons/person.model';
import { PersonsStore } from '../../../../shared/persons/persons.store';
import { ResidencesStore } from '../../../../shared/residences/residences.store';
import { SidePanelService } from '../side-panel.service';

@Component({
  selector: 'app-residence-location',
  standalone: true,
  imports: [],
  templateUrl: './residence-location.component.html',
  styleUrl: './residence-location.component.scss',
})
export class ResidenceLocationComponent {
  readonly lat = input.required<number>();
  readonly lng = input.required<number>();

  private readonly residencesStore = inject(ResidencesStore);
  private readonly personsStore = inject(PersonsStore);
  private readonly sidePanelService = inject(SidePanelService);

  readonly residences = computed(() => this.residencesStore.getByLatLng(this.lat(), this.lng()));

  readonly address = computed(() => {
    const r = this.residences()[0];
    if (!r) return 'Unbekannter Ort';
    const parts = [r.street, r.city, r.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Unbekannter Ort';
  });

  readonly persons = computed(() => {
    const residences = this.residences();
    const allPersons = this.personsStore.persons();
    const seen = new Set<string>();
    const result: { person: Person; residenceId: string }[] = [];
    for (const r of residences) {
      if (!seen.has(r.personId)) {
        seen.add(r.personId);
        const person = allPersons.find((p) => p.id === r.personId);
        if (person) {
          result.push({ person, residenceId: r.id });
        }
      }
    }
    return result;
  });

  openPersonDetail(personId: string, residenceId: string): void {
    this.sidePanelService.open({ type: 'person-detail', personId, residenceId });
  }
}
