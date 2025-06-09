import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Configuracao } from '../shared/models/configuracao.model'; // Ajuste o caminho se necessário
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracaoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/painel/configuracoes`; // URL base da API

  // Busca a configuração pelo ID (usaremos 1 por padrão)
  getConfiguracao(id: number): Observable<Configuracao | null> { // Permite retornar null se não encontrar
    return this.http.get<Configuracao>(`${this.apiUrl}/${id}`);
  }

  // Cria uma nova configuração
  createConfiguracao(configuracao: Omit<Configuracao, 'id'>): Observable<Configuracao> {
    return this.http.post<Configuracao>(this.apiUrl, configuracao);
  }

  // Atualiza uma configuração existente
  updateConfiguracao(id: number, configuracao: Partial<Configuracao>): Observable<Configuracao> {
    // Enviamos apenas os campos que podem ser atualizados
    const updatePayload = {
        descricao_api: configuracao.descricao_api,
        chave_api: configuracao.chave_api
    };
    return this.http.put<Configuracao>(`${this.apiUrl}/${id}`, updatePayload);
  }
} 