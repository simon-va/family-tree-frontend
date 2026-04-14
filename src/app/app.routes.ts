import { Routes } from '@angular/router';
import { WelcomeComponent } from './features/welcome/welcome.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: WelcomeComponent },
  {
    path: 'editor',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/editor/editor.routes').then((m) => m.editorRoutes),
  },
  { path: '**', redirectTo: '' },
];
