import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Person } from '../../../shared/persons/person.model';
import { PersonsStore } from '../../../shared/persons/persons.store';
import { RelationsStore } from '../../../shared/relations/relations.store';
import { SidePanelService } from '../side-panel/side-panel.service';
import { BOX_H, BOX_W, PersonBox, TreeLayout, buildTreeLayout } from './tree-layout';

@Component({
  selector: 'app-tree',
  standalone: true,
  imports: [],
  templateUrl: './tree.component.html',
  styleUrl: './tree.component.scss',
})
export class TreeComponent {
  private readonly personsStore = inject(PersonsStore);
  private readonly relationsStore = inject(RelationsStore);
  private readonly sidePanelService = inject(SidePanelService);

  private readonly sidebarRef = viewChild<ElementRef<HTMLElement>>('sidebar');

  readonly BOX_W = BOX_W;
  readonly BOX_H = BOX_H;

  readonly focusId = signal<string | null>(null);

  readonly selectedPersonId = computed<string | null>(() => {
    const action = this.sidePanelService.action();
    if (
      action.type === 'person-detail' ||
      action.type === 'person-edit' ||
      action.type === 'residence-form' ||
      action.type === 'residence-edit'
    ) {
      return action.personId;
    }
    if (action.type === 'relation-edit' && action.personId) {
      return action.personId;
    }
    return null;
  });

  readonly sortedPersons = computed<Person[]>(() =>
    [...this.personsStore.persons()].sort((a, b) => {
      const da = a.birthDate?.date;
      const db = b.birthDate?.date;
      if (!da && !db)
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      if (!da) return 1;
      if (!db) return -1;
      return db.localeCompare(da);
    }),
  );

  readonly layout = computed<TreeLayout | null>(() => {
    const focusId = this.focusId();
    if (!focusId) return null;
    return buildTreeLayout(focusId, this.personsStore.persons(), this.relationsStore.relations());
  });

  constructor() {
    effect(() => {
      if (this.focusId() || this.sortedPersons().length === 0) return;
      const action = this.sidePanelService.action();
      const personId =
        action.type === 'person-detail' ? action.personId : this.sortedPersons()[0].id;
      this.focusId.set(personId);
      this.sidePanelService.open({ type: 'person-detail', personId });
    });

    effect(() => {
      const id = this.focusId();
      const sidebar = this.sidebarRef()?.nativeElement;
      if (!id || !sidebar) return;
      sidebar
        .querySelector<HTMLElement>(`[data-person-id="${id}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  onPersonBoxClick(personId: string): void {
    this.focusId.set(personId);
    this.sidePanelService.open({ type: 'person-detail', personId });
  }

  onSidebarPersonClick(personId: string): void {
    this.focusId.set(personId);
    this.sidePanelService.open({ type: 'person-detail', personId });
  }

  trackBox(index: number, box: PersonBox): string {
    return box.personId;
  }
}
