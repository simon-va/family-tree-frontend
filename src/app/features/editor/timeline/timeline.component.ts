import { Component, computed, inject, signal } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { FuzzyDate, Person } from '../../../shared/persons/person.model';
import { FuzzyDatePipe } from '../../../shared/persons/fuzzy-date.pipe';
import { PersonsStore } from '../../../shared/persons/persons.store';
import { RelationType } from '../../../shared/relations/relation.model';
import { PARENT_TYPES, RELATION_TYPE_LABELS } from '../../../shared/relations/relation-type.pipe';
import { RelationsStore } from '../../../shared/relations/relations.store';
import { ResidencesStore } from '../../../shared/residences/residences.store';
import {
  TimelineEvent,
  TimelinePersonRow,
  TimelineRelationRow,
  TimelineResidenceRow,
  TimeScale,
} from './timeline.model';

const PX_PER_YEAR = 14;
const LABEL_COL_WIDTH = 200;

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [TooltipModule],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent {
  private readonly personsStore = inject(PersonsStore);
  private readonly relationsStore = inject(RelationsStore);
  private readonly residencesStore = inject(ResidencesStore);
  private readonly fuzzyDatePipe = new FuzzyDatePipe();

  readonly expandedIds = signal<Set<string>>(new Set());
  readonly labelColWidth = LABEL_COL_WIDTH;

  readonly timeScale = computed<TimeScale>(() => {
    const persons = this.personsStore.persons();
    const residences = this.residencesStore.residences();
    const relations = this.relationsStore.relations();

    let minYear = Infinity;
    let maxYear = -Infinity;

    const consider = (d: FuzzyDate | undefined) => {
      if (!d) return;
      const year = new Date(d.date).getFullYear();
      if (!isNaN(year)) {
        if (year < minYear) minYear = year;
        if (year > maxYear) maxYear = year;
      }
    };

    for (const p of persons) {
      consider(p.birthDate);
      consider(p.deathDate);
    }
    for (const r of relations) {
      consider(r.startDate);
      consider(r.endDate);
    }
    for (const r of residences) {
      consider(r.startDate);
      consider(r.endDate);
    }

    const now = new Date().getFullYear();
    if (maxYear < now) maxYear = now;
    if (!isFinite(minYear)) minYear = now - 100;
    if (!isFinite(maxYear)) maxYear = now;

    minYear = Math.floor(minYear / 10) * 10;
    maxYear = Math.ceil(maxYear / 10) * 10 + 10;

    const decades: number[] = [];
    for (let y = minYear; y <= maxYear; y += 10) {
      decades.push(y);
    }

    const totalWidth = (maxYear - minYear) * PX_PER_YEAR;

    return { minYear, maxYear, decades, pxPerYear: PX_PER_YEAR, totalWidth };
  });

  readonly rows = computed<TimelinePersonRow[]>(() => {
    const persons = this.personsStore.persons();
    const relations = this.relationsStore.relations();
    const residences = this.residencesStore.residences();
    const personMap = new Map<string, Person>(persons.map((p) => [p.id, p]));

    const partnerTypes: RelationType[] = ['spouse', 'partner', 'engaged'];

    return [...persons]
      .sort((a, b) => {
        const da = a.birthDate?.date;
        const db = b.birthDate?.date;
        if (!da && !db) return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        if (!da) return 1;
        if (!db) return -1;
        return db.localeCompare(da);
      })
      .map((person) => {
        const birthDate = this.toDate(person.birthDate);
        const deathDate = this.toDate(person.deathDate);
        const events: TimelineEvent[] = [];

        // Birth event
        if (birthDate) {
          const parts = [this.formatFuzzy(person.birthDate)];
          if (person.birthPlace) parts.push(person.birthPlace);
          events.push({ type: 'birth', date: birthDate, tooltip: `Geburt: ${parts.join(', ')}` });
        }

        // Death event
        if (deathDate) {
          const parts = [this.formatFuzzy(person.deathDate)];
          if (person.deathPlace) parts.push(person.deathPlace);
          events.push({ type: 'death', date: deathDate, tooltip: `Tod: ${parts.join(', ')}` });
        }

        // Child-born events (person is parent)
        const childRelations = relations.filter(
          (r) =>
            PARENT_TYPES.includes(r.type) &&
            (r.personAId === person.id || r.personBId === person.id),
        );
        for (const rel of childRelations) {
          const childId = rel.personAId === person.id ? rel.personBId : rel.personAId;
          const child = personMap.get(childId);
          if (child?.birthDate) {
            const d = this.toDate(child.birthDate);
            if (d) {
              events.push({
                type: 'child-born',
                date: d,
                tooltip: `Kind geboren: ${child.firstName} ${child.lastName}, ${this.formatFuzzy(child.birthDate)}`,
              });
            }
          }
        }

        // Relationship events
        const personRelations = relations.filter(
          (r) =>
            partnerTypes.includes(r.type) &&
            (r.personAId === person.id || r.personBId === person.id),
        );

        const relationshipRows: TimelineRelationRow[] = [];
        for (const rel of personRelations) {
          const partnerId = rel.personAId === person.id ? rel.personBId : rel.personAId;
          const partner = personMap.get(partnerId);
          const partnerName = partner ? `${partner.firstName} ${partner.lastName}` : 'Unbekannt';
          const typeLabel = RELATION_TYPE_LABELS[rel.type] ?? rel.type;

          if (rel.startDate) {
            const d = this.toDate(rel.startDate);
            if (d) {
              events.push({
                type: 'relationship-start',
                date: d,
                tooltip: `${typeLabel}: ${partnerName}, ${this.formatFuzzy(rel.startDate)}`,
              });
            }
          }
          if (rel.endDate) {
            const d = this.toDate(rel.endDate);
            if (d) {
              const parts = [`${typeLabel} Ende: ${partnerName}, ${this.formatFuzzy(rel.endDate)}`];
              if (rel.endReason) parts.push(rel.endReason);
              events.push({ type: 'relationship-end', date: d, tooltip: parts.join(' – ') });
            }
          }

          const startDate = this.toDate(rel.startDate);
          if (startDate) {
            const endDate = this.toDate(rel.endDate);
            const tooltipParts = [`${typeLabel} mit ${partnerName}`];
            tooltipParts.push(`Beginn: ${this.formatFuzzy(rel.startDate)}`);
            if (rel.endDate) tooltipParts.push(`Ende: ${this.formatFuzzy(rel.endDate)}`);
            if (rel.endReason) tooltipParts.push(`Grund: ${rel.endReason}`);

            relationshipRows.push({
              relation: rel,
              partnerName: partner?.firstName ?? 'Unbekannt',
              typeLabel,
              relationType: rel.type,
              startDate,
              endDate,
              tooltip: tooltipParts.join('\n'),
            });
          }
        }

        // Residence events
        const personResidences = residences.filter((r) => r.personId === person.id);
        const residenceRows: TimelineResidenceRow[] = [];
        for (const res of personResidences) {
          const address = res.street || 'Unbekannt';

          if (res.startDate) {
            const d = this.toDate(res.startDate);
            if (d) {
              events.push({
                type: 'residence-start',
                date: d,
                tooltip: `Wohnort: ${address}, ${this.formatFuzzy(res.startDate)}`,
              });
            }
          }
          if (res.endDate) {
            const d = this.toDate(res.endDate);
            if (d) {
              events.push({
                type: 'residence-end',
                date: d,
                tooltip: `Wohnort Ende: ${address}, ${this.formatFuzzy(res.endDate)}`,
              });
            }
          }

          const startDate = this.toDate(res.startDate);
          if (startDate) {
            const endDate = this.toDate(res.endDate);
            const tooltipParts = [address];
            tooltipParts.push(`Beginn: ${this.formatFuzzy(res.startDate)}`);
            if (res.endDate) tooltipParts.push(`Ende: ${this.formatFuzzy(res.endDate)}`);

            residenceRows.push({
              residence: res,
              address,
              startDate,
              endDate,
              tooltip: tooltipParts.join('\n'),
            });
          }
        }

        return {
          person,
          birthDate,
          deathDate,
          events,
          relationships: relationshipRows,
          residences: residenceRows,
        } satisfies TimelinePersonRow;
      });
  });

  toggle(personId: string): void {
    const row = this.rows().find((r) => r.person.id === personId);
    if (!row || (row.relationships.length === 0 && row.residences.length === 0)) return;

    this.expandedIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  }

  isExpanded(personId: string): boolean {
    return this.expandedIds().has(personId);
  }

  dateToLeft(date: Date): number {
    const scale = this.timeScale();
    const yearOffset = date.getFullYear() + date.getMonth() / 12 + date.getDate() / 365 - scale.minYear;
    return yearOffset * scale.pxPerYear;
  }

  barWidth(start: Date, end: Date | null): number {
    const endDate = end ?? new Date();
    return Math.max(2, this.dateToLeft(endDate) - this.dateToLeft(start));
  }

  decadeLeft(year: number): number {
    const scale = this.timeScale();
    return (year - scale.minYear) * scale.pxPerYear;
  }

  private toDate(fuzzy: FuzzyDate | undefined): Date | null {
    if (!fuzzy?.date) return null;
    const d = new Date(fuzzy.date);
    return isNaN(d.getTime()) ? null : d;
  }

  private formatFuzzy(fuzzy: FuzzyDate | undefined): string {
    return this.fuzzyDatePipe.transform(fuzzy);
  }
}
