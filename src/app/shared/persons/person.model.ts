export type FuzzyDatePrecision =
  | 'exact'
  | 'month'
  | 'year'
  | 'about'
  | 'estimated'
  | 'before'
  | 'after'
  | 'between';

export interface FuzzyDate {
  id: string;
  precision: FuzzyDatePrecision;
  date: string;
  dateTo?: string;
  note?: string;
}

export type Gender = 'male' | 'female' | 'diverse';

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  middleNames?: string;
  birthName?: string;
  gender?: Gender;
  birthPlace?: string;
  birthDate?: FuzzyDate;
  deathPlace?: string;
  deathDate?: FuzzyDate;
  burialPlace?: string;
  title?: string;
  religion?: string;
  notes?: string;
}

export type FuzzyDateInput = Omit<FuzzyDate, 'id'>;

export interface CreatePersonInput {
  firstName: string;
  lastName: string;
  middleNames?: string;
  birthName?: string;
  gender?: Gender;
  birthPlace?: string;
  birthDate?: FuzzyDateInput;
  deathPlace?: string;
  deathDate?: FuzzyDateInput;
  burialPlace?: string;
  title?: string;
  religion?: string;
  notes?: string;
}
