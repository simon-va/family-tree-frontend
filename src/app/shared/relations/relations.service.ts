import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateRelationInput, Relation } from './relation.model';

const API_BASE = 'https://run.chayns.codes/dd996dd6';

@Injectable({ providedIn: 'root' })
export class RelationsService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Relation[]> {
    return this.http.get<Relation[]>(`${API_BASE}/relations`);
  }

  create(input: CreateRelationInput): Observable<Relation> {
    return this.http.post<Relation>(`${API_BASE}/relations`, input);
  }

  update(id: string, input: CreateRelationInput): Observable<Relation> {
    return this.http.put<Relation>(`${API_BASE}/relations/${id}`, input);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/relations/${id}`);
  }
}
