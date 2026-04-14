import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-accordion',
  templateUrl: './accordion.component.html',
  styleUrl: './accordion.component.scss',
})
export class AccordionComponent {
  readonly label = input.required<string>();
  readonly isOpen = signal(false);
}
