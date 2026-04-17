import { Component } from '@angular/core';
import { PersonsComponent } from './persons/persons.component';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [PersonsComponent],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent {}
