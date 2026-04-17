import { Component, computed, inject, input, output } from '@angular/core';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { Menu, MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { FuzzyDatePipe } from '../../../../../../shared/persons/fuzzy-date.pipe';
import { Residence } from '../../../../../../shared/residences/residence.model';
import { ResidencesStore } from '../../../../../../shared/residences/residences.store';

@Component({
  selector: 'app-residence-item',
  standalone: true,
  imports: [ButtonModule, MenuModule, ConfirmPopupModule, TooltipModule, FuzzyDatePipe],
  templateUrl: './residence-item.component.html',
  styleUrl: './residence-item.component.scss',
  host: { '[class.highlighted]': 'highlighted()' },
})
export class ResidenceItemComponent {
  readonly residence = input.required<Residence>();
  readonly highlighted = input<boolean>(false);
  readonly edit = output<void>();
  readonly deleteConfirmed = output<void>();

  private readonly confirmationService = inject(ConfirmationService);
  private readonly residencesStore = inject(ResidencesStore);

  readonly movedToResidence = computed(() =>
    this.residencesStore.residences().find(r => r.id === this.residence().movedToResidenceId),
  );

  menuItems: MenuItem[] = [];
  private confirmAnchor: HTMLElement | null = null;

  formatAddress(): string {
    const r = this.residence();
    return [r.street, r.city, r.country].filter(Boolean).join(', ');
  }

  openMenu(menu: Menu, event: Event, anchor: HTMLElement): void {
    this.confirmAnchor = anchor;
    this.menuItems = [
      {
        label: 'Bearbeiten',
        icon: 'pi pi-pencil',
        command: () => this.edit.emit(),
      },
      {
        label: 'Löschen',
        icon: 'pi pi-trash',
        command: (e) => this.confirmationService.confirm({
          target: this.confirmAnchor as unknown as EventTarget,
          message: 'Wohnort wirklich löschen?',
          accept: () => this.deleteConfirmed.emit(),
        }),
        labelStyle: { color: 'var(--p-button-outlined-danger-color)' },
        iconStyle: { color: 'var(--p-button-outlined-danger-color)' },
      },
    ];
    menu.toggle(event);
  }
}
