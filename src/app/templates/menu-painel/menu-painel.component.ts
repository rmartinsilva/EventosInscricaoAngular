import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu-painel',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule
  ],
  templateUrl: './menu-painel.component.html',
  styleUrls: ['./menu-painel.component.css']
})
export class MenuPainelComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Propriedade para verificar a permissão
  canViewUsuarios = this.authService.hasPermission('view_usuarios');
  canViewGrupos = this.authService.hasPermission('view_grupos');
  canViewAcessos = this.authService.hasPermission('view_acessos');
  canConfigureGrupoPermissoes = this.authService.hasPermission('view_acesso_grupo');
  canViewConfiguracoes = this.authService.hasPermission('view_configuracoes');
  canViewEventos = this.authService.hasPermission('view_eventos');
  canViewInscricoes = this.authService.hasPermission('view_inscricoes');
  canViewRelatorioInscricoes = this.authService.hasPermission('view_relatorio_inscricoes');

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/painel/login']);
    //console.log('Logout realizado, redirecionando...');
  }
}
