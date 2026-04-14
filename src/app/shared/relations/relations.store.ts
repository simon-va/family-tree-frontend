import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CreateRelationInput, Relation } from './relation.model';
import { RelationsService } from './relations.service';

@Injectable({ providedIn: 'root' })
export class RelationsStore {
  private readonly relationsService = inject(RelationsService);
  private readonly messageService = inject(MessageService);

  readonly relations = signal<Relation[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.relationsService.getAll().subscribe({
      next: (relations) => {
        this.relations.set(relations);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Beziehungen konnten nicht geladen werden.');
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Beziehungen konnten nicht geladen werden.' });
      },
    });
  }

  create(input: CreateRelationInput): Observable<Relation> {
    return this.relationsService.create(input).pipe(
      tap({
        next: (relation) => {
          this.relations.update((list) => [...list, relation]);
          this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Beziehung erstellt.' });
        },
        error: () => {
          this.error.set('Beziehung konnte nicht erstellt werden.');
          this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Beziehung konnte nicht erstellt werden.' });
        },
      }),
    );
  }

  update(id: string, input: CreateRelationInput): Observable<Relation> {
    return this.relationsService.update(id, input).pipe(
      tap({
        next: (relation) => {
          this.relations.update((list) => list.map((r) => (r.id === id ? relation : r)));
          this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Beziehung aktualisiert.' });
        },
        error: () => {
          this.error.set('Beziehung konnte nicht aktualisiert werden.');
          this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Beziehung konnte nicht aktualisiert werden.' });
        },
      }),
    );
  }

  delete(id: string): void {
    this.relationsService.delete(id).subscribe({
      next: () => {
        this.relations.update((list) => list.filter((r) => r.id !== id));
        this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Beziehung gelöscht.' });
      },
      error: () => {
        this.error.set('Beziehung konnte nicht gelöscht werden.');
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Beziehung konnte nicht gelöscht werden.' });
      },
    });
  }
}
