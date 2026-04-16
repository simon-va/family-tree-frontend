import { Component, inject, input, output } from '@angular/core';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { Menu, MenuModule } from 'primeng/menu';
import { Residence } from '../../../../../shared/residences/residence.model';

@Component({
  selector: 'app-residence-item',
  standalone: true,
  imports: [ButtonModule, MenuModule, ConfirmPopupModule],
  templateUrl: './residence-item.component.html',
  styleUrl: './residence-item.component.scss',
})
export class ResidenceItemComponent {
  readonly residence = input.required<Residence>();
  readonly edit = output<void>();
  readonly deleteConfirmed = output<void>();

  private readonly confirmationService = inject(ConfirmationService);

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
