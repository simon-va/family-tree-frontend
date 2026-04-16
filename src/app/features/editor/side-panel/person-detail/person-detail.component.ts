import { Component, computed, inject, input, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { FuzzyDatePipe } from '../../../../shared/persons/fuzzy-date.pipe';
import { GenderPipe } from '../../../../shared/persons/gender.pipe';
import { Person } from '../../../../shared/persons/person.model';
import { PersonsStore } from '../../../../shared/persons/persons.store';
import { ResidencesStore } from '../../../../shared/residences/residences.store';
import { SidePanelService } from '../side-panel.service';
import { ResidenceItemComponent } from './residence-item/residence-item.component';

@Component({
  selector: 'app-person-detail',
  standalone: true,
  imports: [GenderPipe, FuzzyDatePipe, ButtonModule, Divider, ResidenceItemComponent],
  templateUrl: './person-detail.component.html',
  styleUrl: './person-detail.component.scss',
})
export class PersonDetailComponent {
  readonly person = input.required<Person>();

  private readonly personsStore = inject(PersonsStore);
  private readonly residencesStore = inject(ResidencesStore);
  private readonly sidePanelService = inject(SidePanelService);

  readonly confirmDelete = signal(false);

  readonly personResidences = computed(() =>
    this.residencesStore.residences().filter((r) => r.personId === this.person().id),
  );

  openResidenceForm(): void {
    this.sidePanelService.open({ type: 'residence-form', personId: this.person().id });
  }

  onEditResidence(residenceId: string): void {
    this.sidePanelService.open({ type: 'residence-edit', residenceId, personId: this.person().id });
  }

  onDeleteResidence(residenceId: string): void {
    this.residencesStore.delete(residenceId);
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
