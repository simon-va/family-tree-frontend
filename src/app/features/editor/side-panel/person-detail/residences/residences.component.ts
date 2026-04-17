import { Component, computed, inject, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ResidencesStore } from '../../../../../shared/residences/residences.store';
import { SidePanelService } from '../../side-panel.service';
import { ResidenceItemComponent } from './residence-item/residence-item.component';

@Component({
  selector: 'app-person-residences',
  standalone: true,
  imports: [ButtonModule, ResidenceItemComponent],
  templateUrl: './residences.component.html',
  styleUrl: './residences.component.scss',
})
export class PersonResidencesComponent {
  readonly personId = input.required<string>();

  private readonly residencesStore = inject(ResidencesStore);
  private readonly sidePanelService = inject(SidePanelService);

  readonly highlightedResidenceId = computed(() => {
    const a = this.sidePanelService.action();
    return a.type === 'person-detail' ? a.residenceId : undefined;
  });

  readonly personResidences = computed(() => {
    const residences = this.residencesStore.residences().filter((r) => r.personId === this.personId());

    const referencedIds = new Set(residences.map((r) => r.movedToResidenceId).filter(Boolean));
    const movedFromMap = new Map(
      residences.filter((r) => r.movedToResidenceId).map((r) => [r.movedToResidenceId!, r]),
    );

    const head = residences.find((r) => !r.movedToResidenceId && referencedIds.has(r.id));

    const chain: typeof residences = [];
    let current = head;
    while (current) {
      chain.push(current);
      current = movedFromMap.get(current.id);
    }

    const chainIds = new Set(chain.map((r) => r.id));
    const standalone = residences
      .filter((r) => !chainIds.has(r.id))
      .sort((a, b) => (a.city ?? '').localeCompare(b.city ?? ''));

    return [...chain, ...standalone];
  });

  openResidenceForm(): void {
    this.sidePanelService.open({ type: 'residence-form', personId: this.personId() });
  }

  onEditResidence(residenceId: string): void {
    this.sidePanelService.open({ type: 'residence-edit', residenceId, personId: this.personId() });
  }

  onDeleteResidence(residenceId: string): void {
    this.residencesStore.delete(residenceId);
  }
}
