import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PersonsStore } from '../../shared/persons/persons.store';
import { RelationsStore } from '../../shared/relations/relations.store';
import { ResidencesStore } from '../../shared/residences/residences.store';
import { HeaderComponent } from './header/header.component';
import { SidePanelComponent } from './side-panel/side-panel.component';
import { SidePanelService } from './side-panel/side-panel.service';

@Component({
  selector: 'app-editor',
  imports: [RouterOutlet, HeaderComponent, SidePanelComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  animations: [
    trigger('slidePanel', [
      transition(':enter', [
        style({ width: 0 }),
        animate('200ms ease-out'),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ width: 0 })),
      ]),
    ]),
  ],
})
export class EditorComponent implements OnInit {
  readonly sidePanelService = inject(SidePanelService);
  private readonly personsStore = inject(PersonsStore);
  private readonly relationsStore = inject(RelationsStore);
  private readonly residencesStore = inject(ResidencesStore);

  ngOnInit(): void {
    this.personsStore.load();
    this.relationsStore.load();
    this.residencesStore.load();
  }
}
