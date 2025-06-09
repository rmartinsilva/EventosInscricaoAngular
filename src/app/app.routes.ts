import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard'; // Importar o AuthGuard
import { permissionGuard } from './guards/permission.guard'; // Importar PermissionGuard

export const routes: Routes = [
  {
    path: 'painel/login', // Rota atualizada
    // Carregamento dinâmico (lazy loading) do componente standalone
    loadComponent: () => import('./painel/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '', // Rota base alterada de 'site' para '' (raiz)
    loadComponent: () => import('./templates/site-layout/site-layout.component').then(m => m.SiteLayoutComponent),
    children: [
      {
        path: 'evento/inscricao/:urlEvento', // Ex: /site/evento/inscricao?eventoNome=MeuSuperEvento
        // Poderia ser path: 'evento/:eventoId/inscricao' se tivéssemos um ID
        loadComponent: () => import('./site/evento-cadastro/evento-cadastro.component').then(m => m.EventoCadastroComponent),
      },
      {
        path: '', // Rota padrão para a raiz do site, continua redirecionando para inscrição
        redirectTo: 'evento/inscricao',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'painel',
    loadComponent: () => import('./templates/painel-layout/painel-layout.component').then(m => m.PainelLayoutComponent),
    canActivate: [authGuard], // Proteger esta rota e suas filhas
    children: [
      {
        path: 'dashboard', // Rota /painel/dashboard
        loadComponent: () => import('./painel/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'usuarios', // Rota PAI para usuários
        canActivate: [permissionGuard], // Protege todas as rotas filhas de usuários
        data: { permissions: ['view_usuarios'] }, // Permissão necessária para acessar a seção
        children: [
          {
            path: '', // Rota /painel/usuarios -> Lista
            loadComponent: () => import('./painel/usuarios/usuario-list/usuario-list.component').then(m => m.UsuarioListComponent),
            pathMatch: 'full' // Garante que só casa com /painel/usuarios exato
          },
          {
            path: 'novo', // Rota /painel/usuarios/novo -> Formulário (novo)
            loadComponent: () => import('./painel/usuarios/usuario-form/usuario-form.component').then(m => m.UsuarioFormComponent),
            canActivate: [permissionGuard],
            data: { permissions: ['create_usuarios'] }
            // TODO: Adicionar canActivate com permissão 'add_usuarios' se necessário
          },
          {
            path: 'editar/:id', // Rota /painel/usuarios/editar/:id -> Formulário (editar)
            loadComponent: () => import('./painel/usuarios/usuario-form/usuario-form.component').then(m => m.UsuarioFormComponent),
            canActivate: [permissionGuard],
            data: { permissions: ['update_usuarios'] }
            // TODO: Adicionar canActivate com permissão 'edit_usuarios' se necessário
          }
        ]
      },
      {
        path: 'grupos', // Rota PAI para grupos
        canActivate: [permissionGuard],
        data: { permissions: ['view_grupos'] }, // Permissão para ver a lista de grupos
        children: [
          {
            path: '', // Rota /painel/grupos -> Lista
            loadComponent: () => import('./painel/grupos/grupo-list/grupo-list.component').then(m => m.GrupoListComponent),
            pathMatch: 'full'
          },
          {
            path: 'novo', // Rota /painel/grupos/new -> Formulário (novo)
            loadComponent: () => import('./painel/grupos/grupo-form/grupo-form.component').then(m => m.GrupoFormComponent),
            canActivate: [permissionGuard],
            data: { permissions: ['create_grupos'] } // Permissão para criar grupos
          },
          {
            path: 'editar/:id', // Rota /painel/grupos/edit/:id -> Formulário (editar)
            loadComponent: () => import('./painel/grupos/grupo-form/grupo-form.component').then(m => m.GrupoFormComponent),
            canActivate: [permissionGuard],
            data: { permissions: ['update_grupos'] } // Alterado para update_grupos
          }
        ]
      },
      {
        path: 'acessos', // Rota PAI para acessos
        canActivate: [permissionGuard],
        data: { permissions: ['view_acessos'] }, // Permissão para ver a lista de acessos
        children: [
          {
            path: '', // Rota /painel/acessos -> Lista
            loadComponent: () => import('./painel/acessos/acesso-list/acesso-list.component').then(m => m.AcessoListComponent),
            pathMatch: 'full'
          },
          {
            path: 'novo', // Rota /painel/acessos/novo -> Formulário (novo)
            loadComponent: () => import('./painel/acessos/acesso-form/acesso-form.component').then(m => m.AcessoFormComponent),
            canActivate: [permissionGuard],
            data: { permissions: ['create_acessos'] } // Permissão para criar acessos
          },
          {
            path: 'editar/:id', // Rota /painel/acessos/editar/:id -> Formulário (editar)
            loadComponent: () => import('./painel/acessos/acesso-form/acesso-form.component').then(m => m.AcessoFormComponent),
            canActivate: [permissionGuard],
            data: { permissions: ['update_acessos'] } // Permissão para editar acessos
          }
        ]
      },
      {
        path: 'permissoes-grupo',
        loadComponent: () => import('./painel/permissoes-grupo/permissoes-grupo.component').then(m => m.PermissoesGrupoComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['view_acesso_grupo'] } 
      },
      {
        path: 'configuracoes', 
        loadComponent: () => import('./painel/configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['view_configuracoes', 'update_configuracoes'] } // Permissões placeholder
      },
      {
        path: 'eventos',
        canActivate: [permissionGuard],
        data: { permissions: ['view_eventos'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./painel/eventos/evento-list/evento-list.component').then(m => m.EventoListComponent),
            pathMatch: 'full'
          },
          {
            path: 'novo',
            loadComponent: () => import('./painel/eventos/evento-form/evento-form.component').then(m => m.EventoFormComponent),
            canActivate: [permissionGuard],
            data: { permissions: ['create_eventos'] }
          },
          {
            path: 'editar/:codigo',
            loadComponent: () => import('./painel/eventos/evento-form/evento-form.component').then(m => m.EventoFormComponent),
            canActivate: [permissionGuard],
            data: { permissions: ['update_eventos'] }
          }
        ]
      },
      {
        path: 'inscricoes', // Rota PAI para inscricoes
        canActivate: [permissionGuard],
        data: { permissions: ['view_inscricoes'] }, // Permissão para ver a lista de inscrições
        children: [
          {
            path: '', // Rota /painel/inscricoes -> Lista
            loadComponent: () => import('./painel/inscricoes/inscricao-list/inscricao-list.component').then(m => m.InscricaoListComponent),
            pathMatch: 'full'
          },
          {
            path: 'novo', // Rota /painel/inscricoes/novo -> Formulário (novo)
            loadComponent: () => import('./painel/inscricoes/inscricao-form/inscricao-form.component').then(m => m.InscricaoFormComponent),
            canActivate: [permissionGuard],
            data: { permissions: ['create_inscricoes'] } 
          },
          {
            path: 'editar/:codigo', // Rota /painel/inscricoes/editar/:codigo -> Formulário (editar)
            loadComponent: () => import('./painel/inscricoes/inscricao-form/inscricao-form.component').then(m => m.InscricaoFormComponent),
            canActivate: [permissionGuard],
            data: { permissions: ['update_inscricoes'] } // Assumindo update_inscricoes, altere se necessário
          }
        ]
      },
      {
        path: 'relatorios',
        children: [
          {
            path: 'inscricoes',
            loadComponent: () => import('./painel/relatorios/relatorio-inscricoes/relatorio-inscricoes.component').then(m => m.RelatorioInscricoesComponent),
            canActivate: [permissionGuard],
            data: { permissions: ['view_relatorio_inscricoes'] } // Nova permissão
          }
        ]
      },
      {
        path: 'home', // Rota /painel/home
        redirectTo: 'dashboard', // Redireciona para dashboard por enquanto
        pathMatch: 'full'
      },
      {
        path: '', // Rota /painel (raiz do painel)
        redirectTo: 'dashboard', // Redireciona para dashboard
        pathMatch: 'full'
      }
      // Adicionar outras rotas filhas do painel aqui
    ]
  },
  // TODO: Adicionar outras rotas aqui (ex: rota padrão, rotas protegidas)
  // Exemplo rota padrão (agora redirecionaria para painel/login):
  // { path: '', redirectTo: 'painel/login', pathMatch: 'full' }, // ESTA LINHA SERÁ REMOVIDA/COMENTADA
  // Exemplo rota protegida (requer um AuthGuard):
  // {
  //   path: 'painel',
  //   loadChildren: () => import('./painel/painel.routes').then(m => m.PAINEL_ROUTES), // Se painel for um módulo com rotas filhas
  //   canActivate: [AuthGuard] // Ou a função do guard diretamente
  // }
  // Rota Curinga (opcional, para página 404)
  { path: '**', redirectTo: 'painel/login' } // Mantém o login do painel como fallback geral
];
