import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { FuzzyDatePipe } from '../../../../shared/persons/fuzzy-date.pipe';
import { PersonsStore } from '../../../../shared/persons/persons.store';
import { RELATION_TYPE_LABELS, RelationTypePipe } from '../../../../shared/relations/relation-type.pipe';
import { RelationsStore } from '../../../../shared/relations/relations.store';
import { SidePanelService } from '../../side-panel/side-panel.service';

@Component({
  selector: 'app-relationships',
  standalone: true,
  imports: [ButtonModule, TableModule, RelationTypePipe, FuzzyDatePipe, IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './relationships.component.html',
  styleUrl: './relationships.component.scss',
})
export class RelationshipsComponent implements OnInit {
  readonly relationsStore = inject(RelationsStore);
  readonly personsStore = inject(PersonsStore);
  readonly sidePanelService = inject(SidePanelService);

  private readonly personsMap = computed(
    () => new Map(this.personsStore.persons().map((p) => [p.id, p])),
  );

  readonly searchTerm = signal('');

  readonly resolvedRelations = computed(() =>
    this.relationsStore.relations().map((r) => ({
      ...r,
      personA: this.personsMap().get(r.personAId),
      personB: this.personsMap().get(r.personBId),
    }))
  );

  readonly filteredRelations = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.resolvedRelations();
    return this.resolvedRelations().filter((r) => {
      const nameA = `${r.personA?.firstName ?? ''} ${r.personA?.lastName ?? ''}`.toLowerCase();
      const nameB = `${r.personB?.firstName ?? ''} ${r.personB?.lastName ?? ''}`.toLowerCase();
      const typeLabel = RELATION_TYPE_LABELS[r.type]?.toLowerCase() ?? '';
      return nameA.includes(term) || nameB.includes(term) || r.type.toLowerCase().includes(term) || typeLabel.includes(term);
    });
  });

  readonly selectedRelationId = computed(() => {
    const action = this.sidePanelService.action();
    return action.type === 'relation-detail' || action.type === 'relation-edit' ? action.relationId : null;
  });

  ngOnInit(): void {
    this.relationsStore.load();
  }
}
