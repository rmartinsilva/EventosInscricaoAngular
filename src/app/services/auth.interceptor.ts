import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Adiciona o token à requisição inicial
  const reqWithAuth = addTokenHeader(req, token);

  // Passa a requisição (com ou sem token) adiante
  return next(reqWithAuth).pipe(
    catchError((error: any) => {
      // Verifica se é um erro 401 e NÃO é a URL de refresh/login
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/refresh')
      ) {
        // Tenta fazer o refresh do token
        return authService.refreshToken().pipe(
          switchMap((response) => {
            // Se o refresh funcionou, clona a requisição ORIGINAL com o NOVO token
            const newReq = addTokenHeader(req, response.access_token);            
            // Retorna o fluxo com a nova requisição
            return next(newReq);
          }),
          catchError((refreshError: any) => {
            // Se o refresh falhar, desloga o usuário e propaga o erro
            authService.logout();
            return throwError(() => refreshError); // Ou o erro original (error)
          })
        );
      } else if (error instanceof HttpErrorResponse && error.status === 401) {
        // Se for 401 na URL de login/refresh, apenas desloga (evitar loop)
        //console.warn('Erro 401 na autenticação, deslogando.');
        authService.logout();
      }

      // Para outros erros ou se não for 401, apenas propaga o erro
      return throwError(() => error);
    })
  );
};

// Função helper para adicionar o cabeçalho (evita duplicação)
function addTokenHeader(request: HttpRequest<any>, token: string | null): HttpRequest<any> {
  if (token) {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`)
    });
  }
  return request;
}
