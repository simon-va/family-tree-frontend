import { Component, computed, inject, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RelationsStore } from '../../../../../shared/relations/relations.store';
import { SidePanelService } from '../../side-panel.service';
import { RelationItemComponent } from './relation-item/relation-item.component';

@Component({
  selector: 'app-person-relations',
  standalone: true,
  imports: [ButtonModule, RelationItemComponent],
  templateUrl: './relations.component.html',
  styleUrl: './relations.component.scss',
})
export class PersonRelationsComponent {
  readonly personId = input.required<string>();

  private readonly relationsStore = inject(RelationsStore);
  private readonly sidePanelService = inject(SidePanelService);

  readonly personRelations = computed(() =>
    this.relationsStore.relations().filter(
      (r) => r.personAId === this.personId() || r.personBId === this.personId(),
    ),
  );

  openRelationForm(): void {
    this.sidePanelService.open({ type: 'relation-form' });
  }

  onViewRelation(relationId: string): void {
    this.sidePanelService.open({ type: 'relation-detail', relationId });
  }

  onDeleteRelation(relationId: string): void {
    this.relationsStore.delete(relationId);
  }
}
