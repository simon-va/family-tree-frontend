import { Component, computed, inject, input, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { FuzzyDatePipe } from '../../../../shared/persons/fuzzy-date.pipe';
import { PersonsStore } from '../../../../shared/persons/persons.store';
import { Relation } from '../../../../shared/relations/relation.model';
import { RelationTypePipe } from '../../../../shared/relations/relation-type.pipe';
import { RelationsStore } from '../../../../shared/relations/relations.store';
import { SidePanelService } from '../side-panel.service';

@Component({
  selector: 'app-relation-detail',
  standalone: true,
  imports: [ButtonModule, Divider, FuzzyDatePipe, RelationTypePipe],
  templateUrl: './relation-detail.component.html',
  styleUrl: './relation-detail.component.scss',
})
export class RelationDetailComponent {
  readonly relation = input.required<Relation>();

  private readonly relationsStore = inject(RelationsStore);
  private readonly personsStore = inject(PersonsStore);
  private readonly sidePanelService = inject(SidePanelService);

  readonly personA = computed(() =>
    this.personsStore.persons().find((p) => p.id === this.relation().personAId),
  );

  readonly personB = computed(() =>
    this.personsStore.persons().find((p) => p.id === this.relation().personBId),
  );

  readonly confirmDelete = signal(false);

  onDeleteRequest(): void {
    this.confirmDelete.set(true);
  }

  onDeleteCancel(): void {
    this.confirmDelete.set(false);
  }

  onDeleteConfirm(): void {
    this.relationsStore.delete(this.relation().id);
    this.sidePanelService.close();
    this.confirmDelete.set(false);
  }

  onEdit(): void {
    this.sidePanelService.open({ type: 'relation-edit', relationId: this.relation().id });
  }
}
