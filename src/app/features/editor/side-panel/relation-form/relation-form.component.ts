import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { finalize } from 'rxjs';
import { AccordionComponent } from '../../../../shared/accordion/accordion.component';
import { FuzzyDatePickerComponent } from '../../../../shared/persons/fuzzy-date-picker/fuzzy-date-picker.component';
import { FuzzyDateInput } from '../../../../shared/persons/person.model';
import { PersonsStore } from '../../../../shared/persons/persons.store';
import { PARENT_TYPES, RELATION_TYPE_LABELS } from '../../../../shared/relations/relation-type.pipe';
import { RelationType } from '../../../../shared/relations/relation.model';
import { RelationsStore } from '../../../../shared/relations/relations.store';
import { SidePanelService } from '../side-panel.service';

interface TypeOption {
  label: string;
  value: RelationType;
}

@Component({
  selector: 'app-relation-form',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, SelectModule, Textarea, FuzzyDatePickerComponent, Divider, AccordionComponent],
  templateUrl: './relation-form.component.html',
  styleUrl: './relation-form.component.scss',
})
export class RelationFormComponent implements OnInit {
  private readonly personsStore = inject(PersonsStore);
  private readonly relationsStore = inject(RelationsStore);
  private readonly sidePanelService = inject(SidePanelService);

  readonly relationId = input<string | null>(null);
  readonly personId = input<string | null>(null);

  readonly saving = signal(false);

  readonly personAId = signal<string | null>(null);
  readonly personBId = signal<string | null>(null);
  readonly type = signal<RelationType | null>(null);
  readonly startDate = signal<FuzzyDateInput | null>(null);
  readonly endDate = signal<FuzzyDateInput | null>(null);
  readonly endReason = signal('');
  readonly notes = signal('');

  ngOnInit(): void {
    const id = this.relationId();
    if (!id) return;
    const r = this.relationsStore.relations().find((x) => x.id === id);
    if (!r) return;
    this.personAId.set(r.personAId);
    this.personBId.set(r.personBId);
    this.type.set(r.type);
    this.startDate.set(r.startDate ? { precision: r.startDate.precision, date: r.startDate.date, dateTo: r.startDate.dateTo, note: r.startDate.note } : null);
    this.endDate.set(r.endDate ? { precision: r.endDate.precision, date: r.endDate.date, dateTo: r.endDate.dateTo, note: r.endDate.note } : null);
    this.endReason.set(r.endReason ?? '');
    this.notes.set(r.notes ?? '');
  }

  readonly personOptions = computed(() =>
    this.personsStore.persons().map((p) => ({
      label: `${p.firstName} ${p.lastName}`,
      value: p.id,
    })),
  );

  readonly personAOptions = computed(() =>
    this.personOptions().filter((o) => o.value !== this.personBId()),
  );

  readonly personBOptions = computed(() =>
    this.personOptions().filter((o) => o.value !== this.personAId()),
  );

  readonly typeOptions: TypeOption[] = Object.entries(RELATION_TYPE_LABELS).map(
    ([value, label]) => ({ label, value: value as RelationType }),
  );

  readonly personALabel = computed(() => {
    const t = this.type();
    if (t && PARENT_TYPES.includes(t)) return 'Elternteil';
    if (t === 'spouse' || t === 'partner' || t === 'engaged') return 'Person 1';
    return 'Person A';
  });

  readonly personBLabel = computed(() => {
    const t = this.type();
    if (t && PARENT_TYPES.includes(t)) return 'Kind';
    if (t === 'spouse' || t === 'partner' || t === 'engaged') return 'Person 2';
    return 'Person B';
  });

  readonly isDuplicate = computed(() => {
    const aId = this.personAId();
    const bId = this.personBId();
    const t = this.type();
    if (!aId || !bId || !t) return false;
    const currentId = this.relationId();
    return this.relationsStore.relations().some((r) => {
      if (r.id === currentId) return false;
      return (
        r.type === t &&
        ((r.personAId === aId && r.personBId === bId) ||
          (r.personAId === bId && r.personBId === aId))
      );
    });
  });

  readonly endReasonOptions = computed(() => {
    const t = this.type();
    if (t !== 'spouse') return [];
    const aId = this.personAId();
    const bId = this.personBId();
    if (!aId || !bId) return [];
    const persons = this.personsStore.persons();
    const personA = persons.find((p) => p.id === aId);
    const personB = persons.find((p) => p.id === bId);
    if (!personA || !personB) return [];
    const nameA = `${personA.firstName} ${personA.lastName}`;
    const nameB = `${personB.firstName} ${personB.lastName}`;
    return [`Tod von ${nameA}`, `Tod von ${nameB}`, 'Scheidung'];
  });

  readonly previewText = computed(() => {
    const aId = this.personAId();
    const bId = this.personBId();
    const t = this.type();
    if (!aId || !bId || !t) return '';

    const personA = this.personsStore.persons().find((p) => p.id === aId);
    const personB = this.personsStore.persons().find((p) => p.id === bId);
    if (!personA || !personB) return '';

    const nameA = `${personA.firstName} ${personA.lastName}`;
    const nameB = `${personB.firstName} ${personB.lastName}`;
    const typeLabel = RELATION_TYPE_LABELS[t];

    if (PARENT_TYPES.includes(t)) {
      return `${nameA} ist ${typeLabel} von ${nameB}`;
    }
    return `${nameA} und ${nameB} sind ${typeLabel}`;
  });

  get isValid(): boolean {
    const aId = this.personAId();
    const bId = this.personBId();
    return !!aId && !!bId && !!this.type() && aId !== bId && !this.isDuplicate();
  }

  onPersonAChange(value: string | null): void {
    this.personAId.set(value);
    if (value !== null && value === this.personBId()) {
      this.personBId.set(null);
    }
  }

  onPersonBChange(value: string | null): void {
    this.personBId.set(value);
    if (value !== null && value === this.personAId()) {
      this.personAId.set(null);
    }
  }

  onSubmit(): void {
    if (!this.isValid) return;
    this.saving.set(true);

    const id = this.relationId();
    const input = {
      personAId: this.personAId()!,
      personBId: this.personBId()!,
      type: this.type()!,
      ...(this.startDate() && { startDate: this.startDate()! }),
      ...(this.endDate() && { endDate: this.endDate()! }),
      ...(this.endReason().trim() && { endReason: this.endReason().trim() }),
      notes: this.notes().trim(),
    };

    const op$ = id
      ? this.relationsStore.update(id, input)
      : this.relationsStore.create(input);

    op$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => this.sidePanelService.close(),
    });
  }

  onCancel(): void {
    const id = this.relationId();
    if (id) {
      const pid = this.personId();
      if (pid) {
        this.sidePanelService.open({ type: 'person-detail', personId: pid });
      } else {
        this.sidePanelService.close();
      }
    } else {
      this.sidePanelService.close();
    }
  }
}
