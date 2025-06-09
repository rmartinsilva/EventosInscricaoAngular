import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Participante } from '../shared/models/participante.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ParticipanteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/participantes`;

  constructor() { }

  buscarPorCpf(cpf: string): Observable<Participante> {
    // Remove formatação do CPF
    const cpfNumeros = cpf.replace(/\D/g, '');
    return this.http.get<Participante>(`${this.apiUrl}/cpf/search`, {
      params: { cpf: cpfNumeros }
    });
  }

  criar(participante: Omit<Participante, 'codigo'>): Observable<Participante> {
    return this.http.post<Participante>(this.apiUrl, participante);
  }

  atualizar(codigo: number, participante: Partial<Participante>): Observable<Participante> {
    return this.http.put<Participante>(`${this.apiUrl}/${codigo}`, participante);
  }

} 