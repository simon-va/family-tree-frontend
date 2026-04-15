import { Component, computed, inject, input, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { FuzzyDatePipe } from '../../../../shared/persons/fuzzy-date.pipe';
import { PersonsStore } from '../../../../shared/persons/persons.store';
import { PARENT_TYPES, RELATION_TYPE_LABELS } from '../../../../shared/relations/relation-type.pipe';
import { Relation } from '../../../../shared/relations/relation.model';
import { RelationsStore } from '../../../../shared/relations/relations.store';
import { SidePanelService } from '../side-panel.service';

@Component({
  selector: 'app-relation-detail',
  standalone: true,
  imports: [ButtonModule, Divider, FuzzyDatePipe],
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

  readonly previewText = computed(() => {
    const a = this.personA();
    const b = this.personB();
    const t = this.relation().type;
    if (!a || !b) return '';
    const nameA = `${a.firstName} ${a.lastName}`;
    const nameB = `${b.firstName} ${b.lastName}`;
    const typeLabel = RELATION_TYPE_LABELS[t];
    if (PARENT_TYPES.includes(t)) {
      return `${nameA} ist ${typeLabel} von ${nameB}`;
    }
    return `${nameA} und ${nameB} sind ${typeLabel}`;
  });

  readonly confirmDelete = signal(false);

  onDeleteRequest(): void {
    this.confirmDelete.set(true);
  }

  onDeleteCancel(): void {
    this.confirmDelete.set(false);
  }

  onDeleteConfirm(): void {
    const relations = this.relationsStore.relations();
    const idx = relations.findIndex((r) => r.id === this.relation().id);

    if (relations.length === 1) {
      this.sidePanelService.close();
    } else {
      const next = relations[idx > 0 ? idx - 1 : 1];
      this.sidePanelService.open({ type: 'relation-detail', relationId: next.id });
    }

    this.relationsStore.delete(this.relation().id);
    this.confirmDelete.set(false);
  }

  onEdit(): void {
    this.sidePanelService.open({ type: 'relation-edit', relationId: this.relation().id });
  }
}
