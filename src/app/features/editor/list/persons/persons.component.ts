import { Component, computed, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { FuzzyDatePipe } from '../../../../shared/persons/fuzzy-date.pipe';
import { GenderPipe } from '../../../../shared/persons/gender.pipe';
import { PersonsStore } from '../../../../shared/persons/persons.store';
import { SidePanelService } from '../../side-panel/side-panel.service';

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [ButtonModule, TableModule, GenderPipe, FuzzyDatePipe, IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './persons.component.html',
  styleUrl: './persons.component.scss',
})
export class PersonsComponent {
  readonly store = inject(PersonsStore);
  readonly sidePanelService = inject(SidePanelService);
  readonly selectedPersonId = computed(() => {
    const action = this.sidePanelService.action();
    return action.type === 'person-detail' || action.type === 'person-edit'? action.personId : null;
  });

}
