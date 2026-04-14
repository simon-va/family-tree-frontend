import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CreatePersonInput, Person } from './person.model';
import { PersonsService } from './persons.service';

@Injectable({ providedIn: 'root' })
export class PersonsStore {
  private readonly personsService = inject(PersonsService);
  private readonly messageService = inject(MessageService);

  readonly persons = signal<Person[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  update(id: string, input: CreatePersonInput): Observable<Person> {
    return this.personsService.update(id, input).pipe(
      tap({
        next: (person) => {
          this.persons.update((list) => list.map((p) => (p.id === id ? person : p)));
          this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Person aktualisiert.' });
        },
        error: () => {
          this.error.set('Person konnte nicht aktualisiert werden.');
          this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Person konnte nicht aktualisiert werden.' });
        },
      }),
    );
  }

  create(input: CreatePersonInput): Observable<Person> {
    return this.personsService.create(input).pipe(
      tap({
        next: (person) => {
          this.persons.update((list) => [...list, person]);
          this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Person erstellt.' });
        },
        error: () => {
          this.error.set('Person konnte nicht erstellt werden.');
          this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Person konnte nicht erstellt werden.' });
        },
      }),
    );
  }

  delete(id: string): void {
    this.personsService.delete(id).subscribe({
      next: () => {
        this.persons.update((list) => list.filter((p) => p.id !== id));
        this.messageService.add({ severity: 'success', summary: 'Erfolg', detail: 'Person gelöscht.' });
      },
      error: () => {
        this.error.set('Person konnte nicht gelöscht werden.');
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Person konnte nicht gelöscht werden.' });
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.personsService.getAll().subscribe({
      next: (persons) => {
        this.persons.set(persons);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Personen konnten nicht geladen werden.');
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Personen konnten nicht geladen werden.' });
      },
    });
  }
}
