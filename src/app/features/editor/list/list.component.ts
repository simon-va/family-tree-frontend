import { Component } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { PersonsComponent } from './persons/persons.component';
import { RelationshipsComponent } from './relationships/relationships.component';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [TabsModule, PersonsComponent, RelationshipsComponent],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent {}
