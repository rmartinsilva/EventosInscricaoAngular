import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evento } from '../shared/models/evento.model';
import { PaginatedResponse } from '../shared/models/pagination.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/painel/eventos`;
  private siteApiUrl = `${environment.apiUrl}/evento`;

  constructor(private httpClient: HttpClient) { }

  // Busca eventos paginados com filtro opcional
  getEventos(page: number = 1, perPage: number = 10, filter?: string): Observable<PaginatedResponse<Evento>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (filter && filter.trim() !== '') {
      params = params.set('filter', filter.trim());
    }

    return this.http.get<PaginatedResponse<Evento>>(this.apiUrl, { params });
  }

  getAllEventos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.apiUrl}/all`);
  }

  getEventosAtivos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.apiUrl}/ativos`);
  }

  // Busca um evento pelo código
  getEvento(codigo: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.apiUrl}/${codigo}`);
  }

  // Busca um evento pela URL (para o site)
  getEventoByUrl(urlEvento: string): Observable<Evento> {
    return this.http.get<Evento>(`${this.siteApiUrl}/${urlEvento}`);
  }

  // Cria um novo evento
  // A API espera o objeto sem o 'codigo'
  createEvento(evento: Omit<Evento, 'codigo'>): Observable<Evento> {
    return this.http.post<Evento>(this.apiUrl, evento);
  }

  // Atualiza um evento existente
  updateEvento(codigo: number, evento: Partial<Evento>): Observable<Evento> {
    // Remove o código do corpo, pois ele vai na URL
    const updatePayload = { ...evento };
    delete updatePayload.codigo;
    return this.http.put<Evento>(`${this.apiUrl}/${codigo}`, updatePayload);
  }

  // Exclui um evento pelo código
  deleteEvento(codigo: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${codigo}`);
  }
} 