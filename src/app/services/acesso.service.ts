import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment'; // Ajustado
import { Acesso } from '../shared/models/acesso.model';
import { PaginatedResponse } from '../shared/models/pagination.model'; // Ajustado

@Injectable({
  providedIn: 'root'
})
export class AcessoService {
  private apiUrl = `${environment.apiUrl}/painel/acessos`;

  constructor(private http: HttpClient) { }

  getAcessos(page: number, per_page: number, sort: string, order: string, filter: string): Observable<PaginatedResponse<Acesso>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', per_page.toString())
      .set('sort', sort)
      .set('order', order);
    if (filter) {
      params = params.set('filter', filter);
    }
    return this.http.get<PaginatedResponse<Acesso>>(this.apiUrl, { params });
  }

  getAllAcessos(): Observable<Acesso[]> {
    return this.http.get<{ data: Acesso[] }>(`${this.apiUrl}/all`).pipe(
      map(response => response.data)
    );
  }

  getAcessoById(id: number): Observable<Acesso> {
    return this.http.get<Acesso>(`${this.apiUrl}/${id}`);
  }

  createAcesso(acesso: Acesso): Observable<Acesso> {
    return this.http.post<Acesso>(this.apiUrl, acesso);
  }

  updateAcesso(id: number, acesso: Acesso): Observable<Acesso> {
    return this.http.put<Acesso>(`${this.apiUrl}/${id}`, acesso);
  }

  deleteAcesso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
} 