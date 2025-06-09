import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // Ajustar caminho

export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obter permissões necessárias da propriedade 'data' da rota
  const requiredPermissions = route.data?.[ 'permissions' ] as string[];

  // Se não houver permissões definidas na rota, permitir acesso
  if (!requiredPermissions || requiredPermissions.length === 0) {
    console.warn('PermissionGuard: Nenhuma permissão definida para a rota', route.url);
    return true;
  }

  // Verificar se o usuário tem TODAS as permissões necessárias
  if (authService.hasAllPermissions(requiredPermissions)) {
    return true; // Usuário tem permissão
  }

  // Usuário não tem permissão
  console.warn(
    `PermissionGuard: Acesso negado à rota ${state.url}. Permissões requeridas:`,
    requiredPermissions
  );
  // Redirecionar para dashboard ou página de acesso negado
  router.navigate(['/painel/dashboard'], { queryParams: { acessoNegado: true } }); // Exemplo com queryParam
  return false; // Bloquear acesso
};
