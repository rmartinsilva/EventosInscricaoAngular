import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Grupo } from '../shared/models/grupo.model';

@Injectable({
  providedIn: 'root'
})
export class GrupoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/painel/grupos`;

  getAllGrupos(): Observable<Grupo[]> {
    return this.http.get<{ data: Grupo[] }>(`${this.apiUrl}/all`).pipe(
      map(response => response.data)
    );
  }

  getGrupos(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });
    return this.http.get<any>(this.apiUrl, { params: httpParams });
  }

  getGrupoById(id: number): Observable<Grupo> {
    return this.http.get<Grupo>(`${this.apiUrl}/${id}`);
  }

  createGrupo(grupo: { descricao: string }): Observable<Grupo> {
    return this.http.post<Grupo>(this.apiUrl, grupo);
  }

  updateGrupo(id: number, grupo: { descricao: string }): Observable<Grupo> {
    return this.http.put<Grupo>(`${this.apiUrl}/${id}`, grupo);
  }

  deleteGrupo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
} 