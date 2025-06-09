import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpContext, HttpContextToken } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Defina um token de contexto fora da classe para requisições silenciosas
export const SILENT_LOAD = new HttpContextToken<boolean>(() => false);

@Injectable({
  providedIn: 'root'
})
export class PagamentoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pagamentos`; // Base URL para os pagamentos

  constructor() { }

  gerarPix(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/pix`, payload);
  }

  pagarComCartao(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/cartao`, payload);
  }

  verificarStatusPix(idPagamento: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/status/mp/${idPagamento}`, {
      context: new HttpContext().set(SILENT_LOAD, true)
    });
  }

  // Futuramente, outros métodos relacionados a pagamento podem ser adicionados aqui
  // Ex: processarPagamentoCartao(payload: any): Observable<any> { ... }
} 