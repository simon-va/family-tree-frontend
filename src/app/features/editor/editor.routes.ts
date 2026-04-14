import { Routes } from '@angular/router';
import { EditorComponent } from './editor.component';
import { ListComponent } from './list/list.component';
import { TreeComponent } from './tree/tree.component';
import { TimelineComponent } from './timeline/timeline.component';
import { MapComponent } from './map/map.component';

export const editorRoutes: Routes = [
  {
    path: '',
    component: EditorComponent,
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: ListComponent },
      { path: 'tree', component: TreeComponent },
      { path: 'timeline', component: TimelineComponent },
      { path: 'map', component: MapComponent },
    ],
  },
];
