import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateResidenceInput, Residence } from './residence.model';

const API_BASE = 'https://run.chayns.codes/dd996dd6';

@Injectable({ providedIn: 'root' })
export class ResidencesService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Residence[]> {
    return this.http.get<Residence[]>(`${API_BASE}/residences`);
  }

  create(input: CreateResidenceInput): Observable<Residence> {
    return this.http.post<Residence>(`${API_BASE}/residences`, input);
  }

  update(id: string, input: CreateResidenceInput): Observable<Residence> {
    return this.http.put<Residence>(`${API_BASE}/residences/${id}`, input);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/residences/${id}`);
  }
}
