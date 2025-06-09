import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // Ajustar caminho se necessário

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true; // Usuário logado, permite acesso
  }

  // Usuário não logado, redireciona para login
  console.log('AuthGuard: Usuário não logado, redirecionando para /painel/login');
  router.navigate(['/painel/login']);
  return false; // Impede acesso à rota original
};
