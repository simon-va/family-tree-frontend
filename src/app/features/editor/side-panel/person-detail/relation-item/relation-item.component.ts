import { Component, computed, inject, input, output } from '@angular/core';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { Menu, MenuModule } from 'primeng/menu';
import { PersonsStore } from '../../../../../shared/persons/persons.store';
import { PARENT_TYPES, RELATION_TYPE_LABELS } from '../../../../../shared/relations/relation-type.pipe';
import { Relation } from '../../../../../shared/relations/relation.model';

@Component({
  selector: 'app-relation-item',
  standalone: true,
  imports: [ButtonModule, MenuModule, ConfirmPopupModule],
  templateUrl: './relation-item.component.html',
  styleUrl: './relation-item.component.scss',
})
export class RelationItemComponent {
  readonly relation = input.required<Relation>();
  readonly personId = input.required<string>();
  readonly viewRelation = output<void>();
  readonly deleteConfirmed = output<void>();

  private readonly personsStore = inject(PersonsStore);
  private readonly confirmationService = inject(ConfirmationService);

  menuItems: MenuItem[] = [];
  private confirmAnchor: HTMLElement | null = null;

  readonly label = computed(() => {
    const r = this.relation();
    const pid = this.personId();
    const persons = this.personsStore.persons();
    const isParentType = PARENT_TYPES.includes(r.type);
    const typeLabel = RELATION_TYPE_LABELS[r.type];

    if (isParentType) {
      if (r.personAId === pid) {
        const child = persons.find((p) => p.id === r.personBId);
        return child ? `Kind: ${child.firstName} ${child.lastName}` : 'Kind: —';
      } else {
        const parent = persons.find((p) => p.id === r.personAId);
        return parent ? `${typeLabel}: ${parent.firstName} ${parent.lastName}` : `${typeLabel}: —`;
      }
    }

    const otherId = r.personAId === pid ? r.personBId : r.personAId;
    const other = persons.find((p) => p.id === otherId);
    return other ? `${other.firstName} ${other.lastName} (${typeLabel})` : `— (${typeLabel})`;
  });

  openMenu(menu: Menu, event: Event, anchor: HTMLElement): void {
    this.confirmAnchor = anchor;
    this.menuItems = [
      {
        label: 'Öffnen',
        icon: 'pi pi-arrow-right',
        command: () => this.viewRelation.emit(),
      },
      {
        label: 'Löschen',
        icon: 'pi pi-trash',
        command: () =>
          this.confirmationService.confirm({
            target: this.confirmAnchor as unknown as EventTarget,
            message: 'Beziehung wirklich löschen?',
            accept: () => this.deleteConfirmed.emit(),
          }),
        labelStyle: { color: 'var(--p-button-outlined-danger-color)' },
        iconStyle: { color: 'var(--p-button-outlined-danger-color)' },
      },
    ];
    menu.toggle(event);
  }
}
