import { Component, computed, inject } from '@angular/core';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { FuzzyDatePipe } from '../../../../shared/persons/fuzzy-date.pipe';
import { GenderPipe } from '../../../../shared/persons/gender.pipe';
import { Person } from '../../../../shared/persons/person.model';
import { PersonsStore } from '../../../../shared/persons/persons.store';
import { SidePanelService } from '../../side-panel/side-panel.service';

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [TableModule, GenderPipe, FuzzyDatePipe, IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './persons.component.html',
  styleUrl: './persons.component.scss',
})
export class PersonsComponent {
  readonly store = inject(PersonsStore);
  readonly sidePanelService = inject(SidePanelService);

  readonly sortedPersons = computed(() =>
    [...this.store.persons()].sort((a, b) => {
      const da = a.birthDate?.date;
      const db = b.birthDate?.date;
      if (!da && !db) return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      if (!da) return 1;
      if (!db) return -1;
      return db.localeCompare(da);
    }),
  );

  readonly selectedPersonId = computed(() => {
    const action = this.sidePanelService.action();
    return action.type === 'person-detail' || action.type === 'person-edit' || action.type === 'residence-form' || action.type === 'residence-edit'
      ? action.personId : null;
  });

  readonly selectedPerson = computed(() => {
    const id = this.selectedPersonId();
    if (!id) return null;
    return this.sortedPersons().find((p) => p.id === id) ?? null;
  });

  onRowSelect(data: Person | Person[] | undefined): void {
    if (!data || Array.isArray(data)) return;
    this.sidePanelService.open({ type: 'person-detail', personId: data.id });
  }

  onRowUnselect(): void {
    this.sidePanelService.close();
  }
}
