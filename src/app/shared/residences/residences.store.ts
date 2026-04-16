import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CreateResidenceInput, Residence } from './residence.model';
import { ResidencesService } from './residences.service';

@Injectable({ providedIn: 'root' })
export class ResidencesStore {
  private readonly residencesService = inject(ResidencesService);
  private readonly messageService = inject(MessageService);

  readonly residences = signal<Residence[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.residencesService.getAll().subscribe({
      next: (residences) => {
        this.residences.set(residences);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Wohnorte konnten nicht geladen werden.');
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Wohnorte konnten nicht geladen werden.' });
      },
    });
  }

  create(input: CreateResidenceInput): Observable<Residence> {
    return this.residencesService.create(input).pipe(
      tap({
        next: (residence) => {
          this.residences.update((list) => [...list, residence]);
          this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Wohnort erstellt.' });
        },
        error: () => {
          this.error.set('Wohnort konnte nicht erstellt werden.');
          this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Wohnort konnte nicht erstellt werden.' });
        },
      }),
    );
  }

  update(id: string, input: CreateResidenceInput): Observable<Residence> {
    return this.residencesService.update(id, input).pipe(
      tap({
        next: (residence) => {
          this.residences.update((list) => list.map((r) => (r.id === id ? residence : r)));
          this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Wohnort aktualisiert.' });
        },
        error: () => {
          this.error.set('Wohnort konnte nicht aktualisiert werden.');
          this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Wohnort konnte nicht aktualisiert werden.' });
        },
      }),
    );
  }

  getByLatLng(lat: number, lng: number): Residence[] {
    return this.residences().filter((r) => r.lat === lat && r.lng === lng);
  }

  delete(id: string): void {
    this.residencesService.delete(id).subscribe({
      next: () => {
        this.residences.update((list) => list.filter((r) => r.id !== id));
        this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Wohnort gelöscht.' });
      },
      error: () => {
        this.error.set('Wohnort konnte nicht gelöscht werden.');
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Wohnort konnte nicht gelöscht werden.' });
      },
    });
  }
}
