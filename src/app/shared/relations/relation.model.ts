import { FuzzyDate, FuzzyDateInput } from '../persons/person.model';

export type RelationType =
  | 'biological_parent'
  | 'adoptive_parent'
  | 'foster_parent'
  | 'spouse'
  | 'partner'
  | 'engaged';

export interface Relation {
  id: string;
  personAId: string;
  personBId: string;
  type: RelationType;
  startDate?: FuzzyDate;
  endDate?: FuzzyDate;
  endReason?: string;
  notes: string;
}

export interface CreateRelationInput {
  personAId: string;
  personBId: string;
  type: RelationType;
  startDate?: FuzzyDateInput;
  endDate?: FuzzyDateInput;
  endReason?: string;
  notes: string;
}
