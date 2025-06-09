import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Participante } from '../shared/models/participante.model';
import { Inscricao } from '../shared/models/inscricao.model';
import { PaginatedResponse } from '../shared/models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class InscricaoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/inscricoes`;
  private apiUrlPainel = `${environment.apiUrl}/painel/inscricoes`;

  constructor() { }

  buscarPorParcicipante(codigo: string): Observable<Participante> {
    return this.http.get<Participante>(`${this.apiUrl}/participante/${codigo}`);
  }

  buscarInscricaoPorEventoEParticipante(eventoCodigo: number, participanteCodigo: number): Observable<Inscricao> {
    return this.http.get<Inscricao>(`${this.apiUrl}/participante/${participanteCodigo}/evento/${eventoCodigo}`);
  }

  buscarNumeroInscricoesPorEvento(eventoCodigo: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/count/evento/${eventoCodigo}`);
  }

  buscarNumeroInscricoesCortesiaPorEvento(eventoCodigo: number): Observable<{count: number}> {
    return this.http.get<{count: number}>(`${this.apiUrlPainel}/count/cortesia/evento/${eventoCodigo}`);
  }

  getInscricoesPorEventoRelatorio(
    eventoCodigo: number,
    cortesia?: boolean | null
  ): Observable<{ data: Inscricao[] }> {
    let params = new HttpParams();

    if (cortesia === true) {
      params = params.set('filter', 'true');
    } else if (cortesia === false) {
      params = params.set('filter', 'false');
    }

    return this.http.get<{ data: Inscricao[] }>(`${this.apiUrlPainel}/evento/${eventoCodigo}`, { params });
  }

  buscarTodasInscricoesPainel(
    page: number = 1,
    perPage: number = 15,
    eventoCodigo?: number,
    filter?: string 
  ): Observable<PaginatedResponse<Inscricao>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (eventoCodigo !== undefined && eventoCodigo !== null) {
      params = params.set('evento', eventoCodigo.toString());
    }
    if (filter && filter.trim() !== '') {
      params = params.set('filter', filter.trim());
    }
    return this.http.get<PaginatedResponse<Inscricao>>(this.apiUrlPainel, { params });
  }

  buscarInscricaoPorCodigoPainel(codigo: number): Observable<Inscricao> {
    return this.http.get<Inscricao>(`${this.apiUrlPainel}/${codigo}`);
  }

  criarInscricaoPainel(inscricao: Inscricao): Observable<Inscricao> {
    return this.http.post<Inscricao>(this.apiUrlPainel, inscricao);
  }

  atualizarInscricaoPainel(codigo: number, inscricao: Inscricao): Observable<Inscricao> {
    return this.http.put<Inscricao>(`${this.apiUrlPainel}/${codigo}`, inscricao);
  }

  deletarInscricaoPainel(codigo: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrlPainel}/${codigo}`);
  }
} 