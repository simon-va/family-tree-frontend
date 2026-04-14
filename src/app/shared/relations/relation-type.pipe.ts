import { Pipe, PipeTransform } from '@angular/core';
import { RelationType } from './relation.model';

const LABELS: Record<RelationType, string> = {
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
    return LABELS[value] ?? value;
  }
}
