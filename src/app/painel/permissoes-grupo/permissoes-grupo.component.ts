import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { PickListModule } from 'primeng/picklist';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { Grupo } from '../../shared/models/grupo.model';
import { Acesso } from '../../shared/models/acesso.model';
import { GrupoService } from '../../services/grupo.service';
import { AcessoService } from '../../services/acesso.service';
import { GrupoAcessoService } from '../../services/grupo-acesso.service';
import { AuthService } from '../../services/auth.service';
import { ErrorHandlerService } from '../../shared/error-handler.service';
import { forkJoin, of } from 'rxjs';
import { AcessoGrupo } from '../../shared/models/acesso-grupo.model';

@Component({
  selector: 'app-permissoes-grupo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PickListModule,
    SelectModule,
    ButtonModule
  ],
  templateUrl: './permissoes-grupo.component.html',
  styleUrls: ['./permissoes-grupo.component.css'],
  // providers: [MessageService] // Não é necessário se o toast global for usado
})
export class PermissoesGrupoComponent implements OnInit {
  private grupoService = inject(GrupoService);
  private acessoService = inject(AcessoService);
  private grupoAcessoService = inject(GrupoAcessoService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private errorHandlerService = inject(ErrorHandlerService);

  grupos: Grupo[] = [];
  selectedGrupoId: number | null = null;

  private todosOsAcessos: Acesso[] = [];
  acessosDisponiveis: Acesso[] = [];
  acessosDoGrupo: Acesso[] = [];

  isLoadingGrupos = false;
  isLoadingAcessos = false;
  isSaving = false;
  isLoadingInitialData = false;

  canEditPermissions = this.authService.hasPermission('update_acesso_grupo'); 

  constructor() { 
    // console.log('[PermissoesGrupoComponent] Valor de canEditPermissions:', this.canEditPermissions); // Log removido
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoadingInitialData = true;
    forkJoin({
      grupos: this.grupoService.getAllGrupos(),
      todosAcessos: this.acessoService.getAllAcessos()
    }).subscribe({
      next: (result) => {
        if (!Array.isArray(result.grupos)) {
          this.grupos = []; 
          this.messageService.add({ severity: 'error', summary: 'Erro de Dados', detail: 'Formato inesperado ao carregar grupos.' });
        } else {
          this.grupos = result.grupos;
        }
        
        if (!Array.isArray(result.todosAcessos)) {
          this.todosOsAcessos = [];
          this.messageService.add({ severity: 'error', summary: 'Erro de Dados', detail: 'Formato inesperado ao carregar lista completa de acessos.' });
        } else {
          this.todosOsAcessos = result.todosAcessos;
        }

        if (this.selectedGrupoId && !this.grupos.find(g => g.id === this.selectedGrupoId)) {
          this.selectedGrupoId = null;
          this.acessosDoGrupo = [];
          this.acessosDisponiveis = [];
        }
        this.isLoadingInitialData = false;
      },
      error: (err: any) => {
        this.isLoadingInitialData = false;
        const errorMessage = this.errorHandlerService.formatErrorMessages(err, 'Erro ao carregar dados iniciais.');
        this.messageService.add({ severity: 'error', summary: 'Erro Geral', detail: errorMessage });
      }
    });
  }

  onGrupoChange(): void {
    this.acessosDoGrupo = [];
    this.acessosDisponiveis = [];
    if (this.selectedGrupoId) {
      this.loadAcessosParaGrupo(this.selectedGrupoId);
    } else {
      this.acessosDoGrupo = [];
      this.acessosDisponiveis = [];
    }
  }

  get selectedGrupoDescricao(): string | null {
    if (!this.selectedGrupoId) return null;
    const grupo = this.grupos.find(g => g.id === this.selectedGrupoId);
    return grupo ? grupo.descricao : null;
  }

  loadAcessosParaGrupo(grupoId: number): void {
    if (this.todosOsAcessos.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Lista de todos os acessos não carregada. Tente recarregar a página ou selecionar o grupo novamente.' });
      return;
    }

    this.isLoadingAcessos = true;
    this.acessosDisponiveis = [];
    this.acessosDoGrupo = [];

    forkJoin({
      disponiveis: this.grupoAcessoService.getAcessosDisponiveisParaGrupo(grupoId),
      concedidosRaw: this.grupoAcessoService.getAcessosDoGrupo(grupoId)
    }).subscribe({
      next: (result) => {
        this.acessosDisponiveis = result.disponiveis || [];
        
        const concedidosComDetalhes: Acesso[] = [];
        if (result.concedidosRaw && result.concedidosRaw.length > 0) {
          result.concedidosRaw.forEach(acessoGrupo => {
            if (acessoGrupo.acesso && typeof acessoGrupo.acesso.id === 'number') {
              const acessoDetalhado = this.todosOsAcessos.find(a => a.id === acessoGrupo.acesso.id);
              if (acessoDetalhado) {
                concedidosComDetalhes.push(acessoDetalhado);
              } else {
                // console.warn(`Acesso com ID ${acessoGrupo.acesso.id} concedido ao grupo, mas não encontrado na lista todosOsAcessos.`);
              }
            }
          });
        }
        this.acessosDoGrupo = concedidosComDetalhes;
        
        this.isLoadingAcessos = false;
      },
      error: (err) => {
        this.isLoadingAcessos = false;
        const errorMessage = this.errorHandlerService.formatErrorMessages(err, 'Erro ao carregar acessos para o grupo.');
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: errorMessage });
        this.acessosDisponiveis = [];
        this.acessosDoGrupo = [];
      }
    });
  }

  salvarAcessosDoGrupo(): void {
    if (!this.selectedGrupoId || !this.canEditPermissions) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione um grupo e verifique suas permissões de edição.' });
      return;
    }
    this.isSaving = true;
    this.grupoAcessoService.updateAcessosDoGrupo(this.selectedGrupoId, this.acessosDoGrupo).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Acessos do grupo atualizados com sucesso!' });
        this.loadAcessosParaGrupo(this.selectedGrupoId!); 
      },
      error: (err: any) => {
        this.isSaving = false;
        const errorMessage = this.errorHandlerService.formatErrorMessages(err, 'Erro ao salvar acessos do grupo.');
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: errorMessage });
      }
    });
  }
} 