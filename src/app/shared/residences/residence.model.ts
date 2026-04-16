import { FuzzyDate, FuzzyDateInput } from '../persons/person.model';

export interface Residence {
  id: string;
  personId: string;
  city?: string;
  country?: string;
  street?: string;
  notes?: string;
  lat?: number;
  lng?: number;
  startDate?: FuzzyDate;
  endDate?: FuzzyDate;
}

export interface CreateResidenceInput {
  personId: string;
  city?: string;
  country?: string;
  street?: string;
  notes?: string;
  lat?: number;
  lng?: number;
  startDate?: FuzzyDateInput;
  endDate?: FuzzyDateInput;
}

export const COUNTRY_OPTIONS: string[] = [
  'Deutschland',
  'Albanien',
  'Andorra',
  'Belarus',
  'Belgien',
  'Bosnien und Herzegowina',
  'Bulgarien',
  'Dänemark',
  'Estland',
  'Finnland',
  'Frankreich',
  'Griechenland',
  'Irland',
  'Island',
  'Italien',
  'Kasachstan',
  'Kosovo',
  'Kroatien',
  'Lettland',
  'Liechtenstein',
  'Litauen',
  'Luxemburg',
  'Malta',
  'Moldau',
  'Monaco',
  'Montenegro',
  'Niederlande',
  'Nordmazedonien',
  'Norwegen',
  'Österreich',
  'Polen',
  'Portugal',
  'Rumänien',
  'Russland',
  'San Marino',
  'Schweden',
  'Schweiz',
  'Serbien',
  'Slowakei',
  'Slowenien',
  'Spanien',
  'Tschechien',
  'Türkei',
  'Ukraine',
  'Ungarn',
  'Vatikanstadt',
  'Vereinigtes Königreich',
  'Zypern',
];