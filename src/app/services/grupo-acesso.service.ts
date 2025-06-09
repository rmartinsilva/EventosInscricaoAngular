import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, EMPTY } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Acesso } from '../shared/models/acesso.model';
import { Grupo } from '../shared/models/grupo.model';
import { AcessoGrupo } from '../shared/models/acesso-grupo.model';
import { AcessoService } from './acesso.service';

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class GrupoAcessoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/painel/acesso-grupo`; 
  private acessoService = inject(AcessoService);

  constructor() { }

  /**
   * Busca os Acessos (permissões) atualmente concedidos a um grupo específico.
   * Endpoint: GET /api/painel/acesso-grupo/acessos-bygrupo/{grupoId}
   * Espera uma resposta como { data: AcessoGrupo[] } e mapeia para Acesso[].
   */
  getAcessosDoGrupo(grupoId: number): Observable<AcessoGrupo[]> {
    return this.http.get<ApiResponse<AcessoGrupo[]>>(`${this.apiUrl}/acessos-bygrupo/${grupoId}`).pipe(
      map(response => response.data || []),
    );
  }

  /**
   * Busca os Acessos (permissões) que AINDA PODEM ser adicionados a um grupo específico.
   * Endpoint: GET /api/painel/acesso-grupo/acessos-disponiveis/{grupoId}
   * Retorna: { data: Acesso[] }
   */
  getAcessosDisponiveisParaGrupo(grupoId: number): Observable<Acesso[]> {
    return this.http.get<ApiResponse<Acesso[]>>(`${this.apiUrl}/acessos-disponiveis/${grupoId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Sincroniza a lista de Acessos (permissões) para um grupo específico.
   * Endpoint: POST /api/painel/acesso-grupo/{grupoId}/sync
   * Body: { "acessos": [id1, id2, ...] }
   */
  updateAcessosDoGrupo(grupoId: number, acessosConcedidos: Acesso[]): Observable<any> {
    const acessoIds = acessosConcedidos.map(a => a.id);
    return this.http.post(`${this.apiUrl}/${grupoId}/sync`, { acessos: acessoIds });
  }
} 