import { FuzzyDate, FuzzyDateInput } from '../persons/person.model';

export interface Residence {
  id: string;
  personId: string;
  city?: string;
  country?: string;
  street?: string;
  notes?: string;
  startDate?: FuzzyDate;
  endDate?: FuzzyDate;
}

export interface CreateResidenceInput {
  personId: string;
  city?: string;
  country?: string;
  street?: string;
  notes?: string;
  startDate?: FuzzyDateInput;
  endDate?: FuzzyDateInput;
}
