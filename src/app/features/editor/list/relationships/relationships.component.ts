import { Component, OnInit, computed, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { FuzzyDatePipe } from '../../../../shared/persons/fuzzy-date.pipe';
import { PersonsStore } from '../../../../shared/persons/persons.store';
import { RelationTypePipe } from '../../../../shared/relations/relation-type.pipe';
import { RelationsStore } from '../../../../shared/relations/relations.store';
import { SidePanelService } from '../../side-panel/side-panel.service';

@Component({
  selector: 'app-relationships',
  standalone: true,
  imports: [ButtonModule, TableModule, RelationTypePipe, FuzzyDatePipe],
  templateUrl: './relationships.component.html',
  styleUrl: './relationships.component.scss',
})
export class RelationshipsComponent implements OnInit {
  readonly relationsStore = inject(RelationsStore);
  readonly personsStore = inject(PersonsStore);
  readonly sidePanelService = inject(SidePanelService);

  readonly personsMap = computed(
    () => new Map(this.personsStore.persons().map((p) => [p.id, p])),
  );

  readonly selectedRelationId = computed(() => {
    const action = this.sidePanelService.action();
    return action.type === 'relation-detail' || action.type === 'relation-edit' ? action.relationId : null;
  });

  ngOnInit(): void {
    this.relationsStore.load();
  }
}
