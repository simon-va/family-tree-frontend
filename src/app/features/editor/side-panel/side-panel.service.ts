import { Injectable, signal } from '@angular/core';
import { PanelAction } from './side-panel.model';

@Injectable({ providedIn: 'root' })
export class SidePanelService {
  readonly action = signal<PanelAction>({ type: 'none' });

  open(action: PanelAction): void {
    this.action.set(action);
  }

  close(): void {
    this.action.set({ type: 'none' });
  }
}
