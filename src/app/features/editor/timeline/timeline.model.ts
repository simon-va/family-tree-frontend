import { Person, FuzzyDate } from '../../../shared/persons/person.model';
import { Relation, RelationType } from '../../../shared/relations/relation.model';
import { Residence } from '../../../shared/residences/residence.model';

export type TimelineEventType =
  | 'birth'
  | 'death'
  | 'child-born'
  | 'relationship-start'
  | 'relationship-end'
  | 'residence-start'
  | 'residence-end';

export interface TimelineEvent {
  type: TimelineEventType;
  date: Date;
  tooltip: string;
}

export interface TimelineEventGroup {
  year: number;
  events: TimelineEvent[];
  tooltip: string;
  cssClass: string;
}

export interface TimelineRelationRow {
  relation: Relation;
  partnerName: string;
  typeLabel: string;
  relationType: RelationType;
  startDate: Date;
  endDate: Date | null;
  tooltip: string;
}

export interface TimelineResidenceRow {
  residence: Residence;
  address: string;
  startDate: Date;
  endDate: Date | null;
  tooltip: string;
}

export interface TimelinePersonRow {
  person: Person;
  birthDate: Date | null;
  deathDate: Date | null;
  events: TimelineEvent[];
  groupedEvents: TimelineEventGroup[];
  groupedBirthDeathEvents: TimelineEventGroup[];
  relationships: TimelineRelationRow[];
  residences: TimelineResidenceRow[];
}

export interface TimeScale {
  minYear: number;
  maxYear: number;
  decades: number[];
  pxPerYear: number;
  totalWidth: number;
}
