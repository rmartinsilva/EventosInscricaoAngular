import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { GrupoUsuario } from '../shared/models/grupousuario.model';
import { Observable } from 'rxjs';
import { Grupo } from '../shared/models/grupo.model';

@Injectable({
  providedIn: 'root'
})
export class GrupousuarioService {

  private apiUrl = `${environment.apiUrl}/painel/grupo-usuario`;
  private http = inject(HttpClient);

  getGruposByUsuario(usuarioId: number): Observable<GrupoUsuario[]> {
    return this.http.get<GrupoUsuario[]>(`${this.apiUrl}/all?filter=${usuarioId}`);
  }

  getGruposDisponiveis(usuarioId: number): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${this.apiUrl}/grupos-disponiveis/${usuarioId}`);
  }

  addUsuarioToGrupo(grupoUsuario: GrupoUsuario): Observable<any> {
    console.log('Adicionando grupo ao usuário:', grupoUsuario);
    const payload = {
      grupo: { id: grupoUsuario.grupo!.id },
      usuario: { id: grupoUsuario.usuario!.id }
    };
    return this.http.post(`${this.apiUrl}`, payload);
  }

  removeUsuarioFromGrupo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
