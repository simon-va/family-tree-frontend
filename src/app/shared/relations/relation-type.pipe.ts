import { Pipe, PipeTransform } from '@angular/core';
import { RelationType } from './relation.model';

export const PARENT_TYPES: RelationType[] = [
  'biological_parent',
  'adoptive_parent',
  'foster_parent',
];

export const RELATION_TYPE_LABELS: Record<RelationType, string> = {
  biological_parent: 'Biologisches Elternteil',
  adoptive_parent: 'Adoptiv-Elternteil',
  foster_parent: 'Pflegeelternteil',
  spouse: 'Ehepartner/in',
  partner: 'Partner/in',
  engaged: 'Verlobt',
};

@Pipe({ name: 'relationType', standalone: true })
export class RelationTypePipe implements PipeTransform {
  transform(value: RelationType | undefined): string {
    if (!value) return '';
    return RELATION_TYPE_LABELS[value] ?? value;
  }
}
