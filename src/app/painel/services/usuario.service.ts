import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../../shared/models/usuario.model';
import { PaginatedResponse } from '../../shared/models/pagination.model';

interface LoginCheckResponse {
  exists: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root' // Ou fornecer no módulo do painel, se preferir
})
export class UsuarioService {

  private apiUrl = `${environment.apiUrl}/painel/usuarios`;
  private http = inject(HttpClient);

  getUsuarios(page: number = 1, perPage: number = 15): Observable<PaginatedResponse<Usuario>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Usuario>>(this.apiUrl, { params });
  }

  getUsuario(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  createUsuario(usuario: Omit<Usuario, 'id'>): Observable<Usuario> {
    // A API retorna o usuário criado, incluindo o novo 'id'
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  updateUsuario(id: number, usuario: Partial<Omit<Usuario, 'id'>>): Observable<Usuario> {
    // Usamos Partial<Omit<...>> pois podemos querer atualizar apenas alguns campos (ex: não enviar senha se não mudou)
    // A API pode retornar o usuário atualizado
    // Usando PUT aqui, assumindo que substitui o recurso inteiro (ou use PATCH se a API suportar atualização parcial)
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  // PATCH seria ideal se a API permitir atualizar campos específicos
  // patchUsuario(id: number, usuario: Partial<Omit<Usuario, 'id'>>): Observable<Usuario> {
  //   return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, usuario);
  // }

  deleteUsuario(id: number): Observable<void> {
    // DELETE geralmente não retorna conteúdo (void)
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  checkLoginExists(login: string, excludeUserId?: number): Observable<LoginCheckResponse> {
    let params = new HttpParams().set('login', login);
    if (excludeUserId) {
      params = params.set('exclude_user_id', excludeUserId.toString());
    }
    return this.http.get<LoginCheckResponse>(`${this.apiUrl}/check-login`, { params });
  }
} 