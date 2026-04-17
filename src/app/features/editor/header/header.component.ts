import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectButtonChangeEvent } from 'primeng/selectbutton';
import { SidePanelService } from '../side-panel/side-panel.service';

interface ViewOption {
  label: string;
  value: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-header',
  imports: [FormsModule, ButtonModule, MenubarModule, SelectButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly sidePanelService = inject(SidePanelService);

  readonly viewOptions: ViewOption[] = [
    { label: 'Liste', value: 'list' },
    { label: 'Baum', value: 'tree', disabled: true },
    { label: 'Zeitstrahl', value: 'timeline' },
    { label: 'Karte', value: 'map' },
  ];

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly activeView = computed(() => {
    const segments = this.currentUrl().split('/').filter(Boolean);
    return segments[segments.length - 1] ?? 'list';
  });

  onViewChange(event: SelectButtonChangeEvent): void {
    if (!event.value) return;
    this.router.navigate(['/editor', event.value]);
  }

  openPersonForm(): void {
    this.sidePanelService.open({ type: 'person-form' });
  }

  openRelationForm(): void {
    this.sidePanelService.open({ type: 'relation-form' });
  }
}
