import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatePersonInput, Person } from './person.model';

const API_BASE = 'https://run.chayns.codes/dd996dd6';

@Injectable({ providedIn: 'root' })
export class PersonsService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Person[]> {
    return this.http.get<Person[]>(`${API_BASE}/persons`);
  }

  create(input: CreatePersonInput): Observable<Person> {
    return this.http.post<Person>(`${API_BASE}/persons`, input);
  }

  update(id: string, input: CreatePersonInput): Observable<Person> {
    return this.http.put<Person>(`${API_BASE}/persons/${id}`, input);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/persons/${id}`);
  }
}
