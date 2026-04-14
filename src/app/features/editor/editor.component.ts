import { animate, style, transition, trigger } from '@angular/animations';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
export class EditorComponent {
  readonly sidePanelService = inject(SidePanelService);
}
