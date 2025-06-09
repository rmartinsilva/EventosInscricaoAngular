import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service'; // Ajustar caminho
import { CommonModule } from '@angular/common'; // Importar CommonModule para *ngIf

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule], // Adicionar CommonModule
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent {
  // Injetar AuthService para verificar permissões
  authService = inject(AuthService);

  // Dados simulados para exemplo
  usuarios = [
    { id: 1, nome: 'Usuário A' },
    { id: 2, nome: 'Usuário B' }
  ];

  excluirUsuario(id: number) {
    // Lógica real de exclusão (chamada API) iria aqui
    // Apenas como exemplo:
    if (this.authService.hasPermission('delete_usuarios')) {
       console.log(`Tentando excluir usuário ${id} (requer permissão 'delete_usuarios' no backend)`);
       alert('Funcionalidade de exclusão (requer permissão no backend).');
    } else {
       console.warn('Tentativa de exclusão sem permissão (UI)');
       alert('Você não tem permissão para excluir usuários.'); // Feedback visual
    }
  }
}
