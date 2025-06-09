import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Importar HttpClient
import { Observable, tap, BehaviorSubject } from 'rxjs'; // Importar Observable, tap e BehaviorSubject
import { environment } from '../../environments/environment'; // Importar environment
import { JwtHelperService } from '@auth0/angular-jwt'; // Importar JwtHelperService
import { Router } from '@angular/router'; // Importar Router para o logout

// Interface para a resposta do login
interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl; // Usar a URL do environment
  private http = inject(HttpClient);
  private jwtHelper = inject(JwtHelperService); // Injetar JwtHelperService
  private router = inject(Router);

  private userPermissions: string[] = []; // Armazenar permissões aqui
  private userName = new BehaviorSubject<string | null>(null); // BehaviorSubject para o nome do usuário
  public userName$ = this.userName.asObservable(); // Observable público para o nome

  constructor() {
    // Ao iniciar o serviço, tentar carregar dados do token existente
    this.loadDataFromToken();
  }

  // Método de login atualizado com salvamento automático do token
  login(credentials: { login: string; password: string }): Observable<LoginResponse> {
    const loginUrl = `${this.apiUrl}/painel/auth/login`; // Endpoint específico de login
    return this.http.post<LoginResponse>(loginUrl, credentials).pipe(
      tap(response => this.saveToken(response.access_token)) // Salva o token após sucesso
    );
  }

  // Novo método para refresh token
  refreshToken(): Observable<LoginResponse> {
    const refreshUrl = `${this.apiUrl}/painel/auth/refresh`;
    // A requisição de refresh em si NÃO precisa enviar dados no corpo,
    // mas o interceptor garantirá que o token atual (expirado) vá no header.
    return this.http.post<LoginResponse>(refreshUrl, {}).pipe(
      tap(response => {        
        this.saveToken(response.access_token); // Salva o novo token
      })
    );
  }

  // Exemplo: Método para armazenar o token (localStorage, sessionStorage)
  saveToken(token: string): void {
    // TODO: Implementar armazenamento seguro do token
    localStorage.setItem('authToken', token);
    this.decodeAndStoreData(token); // Atualizado para chamar o método unificado
  }

  // Exemplo: Método para obter o token
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Verifica se o token existe e não está expirado
  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  // Exemplo: Método para logout
  logout(): void {
    localStorage.removeItem('authToken');
    this.userPermissions = []; // Limpar permissões
    this.userName.next(null); // Limpar nome do usuário
    this.router.navigate(['/painel/login']);
  }

  // Decodifica o token e armazena as permissões e o nome do usuário
  private decodeAndStoreData(token: string | null): void {
    if (token) {
      try {
        const decodedToken = this.jwtHelper.decodeToken(token);
        // Assumindo que as permissões estão em um campo 'permissions' ou 'permissoes'
        this.userPermissions = decodedToken?.permissions || decodedToken?.permissoes || [];
        // Assumindo que o nome está em um campo 'name' ou 'nome'
        const name = decodedToken?.name || null;
        this.userName.next(name); // Atualiza o BehaviorSubject com o nome
      } catch (error) {
        //console.error('Erro ao decodificar token:', error);
        this.userPermissions = [];
        this.userName.next(null); // Limpa o nome em caso de erro
      }
    } else {
      this.userPermissions = [];
      this.userName.next(null); // Limpa o nome se não houver token
    }
  }

  // Carrega dados (permissões e nome) do token armazenado (ao iniciar o serviço)
  private loadDataFromToken(): void { // Renomeado de loadPermissionsFromToken
    const token = this.getToken();
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      this.decodeAndStoreData(token); // Atualizado para chamar o método unificado
    } else {
       this.userPermissions = []; // Garante que esteja limpo se não houver token válido
       this.userName.next(null); // Garante que o nome esteja limpo
    }
  }

  // Verifica se o usuário possui uma permissão específica
  hasPermission(permission: string): boolean {
    return this.userPermissions.includes(permission);
  }

  // Verifica se o usuário possui TODAS as permissões de uma lista
  hasAllPermissions(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) {
      return true; // Se não exigir permissões, permite
    }
    return permissions.every(p => this.userPermissions.includes(p));
  }

  // Opcional: Verifica se o usuário possui ALGUMA das permissões de uma lista
  // hasAnyPermission(permissions: string[]): boolean {
  //   if (!permissions || permissions.length === 0) {
  //     return true;
  //   }
  //   return permissions.some(p => this.userPermissions.includes(p));
  // }

  // TODO: Adicionar outros métodos relacionados à autenticação/autorização conforme necessário
  // (ex: getUserInfo, refreshToken, etc.)
}
