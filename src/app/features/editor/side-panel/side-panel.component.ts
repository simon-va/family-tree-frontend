import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { PersonsStore } from '../../../shared/persons/persons.store';
import { RelationsStore } from '../../../shared/relations/relations.store';
import { PersonDetailComponent } from './person-detail/person-detail.component';
import { PersonFormComponent } from './person-form/person-form.component';
import { RelationDetailComponent } from './relation-detail/relation-detail.component';
import { RelationFormComponent } from './relation-form/relation-form.component';
import { ResidenceFormComponent } from './residence-form/residence-form.component';
import { ResidenceLocationComponent } from './residence-location/residence-location.component';
import { SidePanelService } from './side-panel.service';

@Component({
  selector: 'app-side-panel',
  standalone: true,
  imports: [ButtonModule, PersonDetailComponent, PersonFormComponent, RelationFormComponent, RelationDetailComponent, ResidenceFormComponent, ResidenceLocationComponent],
  templateUrl: './side-panel.component.html',
  styleUrl: './side-panel.component.scss',
})
export class SidePanelComponent {
  readonly service = inject(SidePanelService);
  private readonly store = inject(PersonsStore);
  private readonly relationsStore = inject(RelationsStore);

  readonly person = computed(() => {
    const action = this.service.action();
    if (action.type !== 'person-detail') return null;
    return this.store.persons().find((p) => p.id === action.personId) ?? null;
  });

  readonly editPersonId = computed(() => {
    const action = this.service.action();
    return action.type === 'person-edit' ? action.personId : null;
  });

  readonly relation = computed(() => {
    const action = this.service.action();
    if (action.type !== 'relation-detail') return null;
    return this.relationsStore.relations().find((r) => r.id === action.relationId) ?? null;
  });

  readonly editRelationId = computed(() => {
    const action = this.service.action();
    return action.type === 'relation-edit' ? action.relationId : null;
  });

  readonly residenceFormPersonId = computed(() => {
    const action = this.service.action();
    return action.type === 'residence-form' ? action.personId : null;
  });

  readonly editResidenceId = computed(() => {
    const action = this.service.action();
    return action.type === 'residence-edit' ? action.residenceId : null;
  });

  readonly residenceLocation = computed(() => {
    const action = this.service.action();
    return action.type === 'residence-location' ? { lat: action.lat, lng: action.lng } : null;
  });

  private static readonly STORAGE_KEY = 'side-panel-width';

  readonly panelWidth = signal(this.loadWidth());
  readonly isResizing = signal(false);

  private startX = 0;
  private startWidth = 0;

  private loadWidth(): number {
    const stored = localStorage.getItem(SidePanelComponent.STORAGE_KEY);
    return stored ? Number(stored) : 360;
  }

  onDragHandleDblClick(): void {
    this.panelWidth.set(360);
    localStorage.setItem(SidePanelComponent.STORAGE_KEY, String(360));
  }

  onDragHandleMouseDown(event: MouseEvent): void {
    this.isResizing.set(true);
    this.startX = event.clientX;
    this.startWidth = this.panelWidth();
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing()) return;
    const delta = this.startX - event.clientX;
    const newWidth = Math.min(600, Math.max(280, this.startWidth + delta));
    this.panelWidth.set(newWidth);
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (!this.isResizing()) return;
    this.isResizing.set(false);
    localStorage.setItem(SidePanelComponent.STORAGE_KEY, String(this.panelWidth()));
  }
}
