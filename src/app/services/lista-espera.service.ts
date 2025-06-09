import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ListaEspera, CriarListaEsperaPayload } from '../shared/models/lista-espera.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ListaEsperaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/esperas`; // Endpoint base da API de lista de espera

  /**
   * Salva um novo registro na lista de espera.
   * @param payload Dados para criar o registro na lista de espera.
   * @returns Observable com o registro da lista de espera criado.
   */
  salvarListaEspera(payload: CriarListaEsperaPayload): Observable<ListaEspera> {
    return this.http.post<ListaEspera>(this.apiUrl, payload);
  }

  /**
   * Busca todos os registros da lista de espera para um evento específico.
   * @param eventoCodigo O código do evento.
   * @returns Observable com um array de registros da lista de espera.
   */
  buscarTodosPorEvento(eventoCodigo: number): Observable<ListaEspera[]> {
    const params = new HttpParams().set('evento', eventoCodigo.toString());
    return this.http.get<ListaEspera[]>(`${this.apiUrl}/all`, { params });
  }

  /**
   * Busca um registro específico da lista de espera pelo seu código.
   * @param codigoEspera O código do registro na lista de espera.
   * @returns Observable com o registro da lista de espera encontrado.
   */
  buscarListaEsperaPorCodigo(codigoEspera: number): Observable<ListaEspera> {
    return this.http.get<ListaEspera>(`${this.apiUrl}/${codigoEspera}`);
  }

  /**
   * Remove um registro da lista de espera pelo seu código.
   * @param codigoEspera O código do registro na lista de espera a ser removido.
   * @returns Observable<void>
   */
  removerDaListaEspera(codigoEspera: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${codigoEspera}`);
  }


  //buscar lista de espera por participante e evento
  buscarListaEsperaPorParticipanteEEvento(participanteCodigo: number, eventoCodigo: number): Observable<ListaEspera> {
    return this.http.get<ListaEspera>(`${this.apiUrl}/participante/${participanteCodigo}/evento/${eventoCodigo}`);
  }

} 