import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { InscricaoService } from '../../../services/inscricao.service';
import { EventoService } from '../../../services/evento.service';
import { Inscricao } from '../../../shared/models/inscricao.model';
import { Evento } from '../../../shared/models/evento.model';
import { Participante } from '../../../shared/models/participante.model';
import { PaginatedResponse } from '../../../shared/models/pagination.model';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inscricao-list',
  templateUrl: './inscricao-list.component.html',
  styleUrls: ['./inscricao-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    DropdownModule,
    InputTextModule,
    FormsModule
  ],
  providers: [MessageService, ConfirmationService]
})
export class InscricaoListComponent implements OnInit {
  @ViewChild('dtInscricoes') dtInscricoes!: Table;

  private inscricaoService = inject(InscricaoService);
  private eventoService = inject(EventoService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  inscricoes: Inscricao[] = [];
  totalRecords: number = 0;
  loading: boolean = true;
  
  eventosParaFiltro: Evento[] = [];
  eventoSelecionadoFiltro: Evento | null = null;
  filtroNomeParticipante: string = '';

  rowsPerPage: number = 10;
  
  constructor() { }

  ngOnInit(): void {
    this.carregarEventosParaFiltro();
  }

  carregarEventosParaFiltro(): void {
    this.eventoService.getEventos(1, 100).subscribe(
      (response) => this.eventosParaFiltro = response.data,
      (err) => console.error('Erro ao carregar eventos para filtro', err)
    );
  }

  carregarInscricoes(event?: any): void {
    this.loading = true;
    const page = event ? (event.first / event.rows) + 1 : 1;
    const perPage = event ? event.rows : this.rowsPerPage;
    const eventoCodigoFiltro = this.eventoSelecionadoFiltro?.codigo;
    const nomeFiltro = this.filtroNomeParticipante.trim();

    this.inscricaoService.buscarTodasInscricoesPainel(page, perPage, eventoCodigoFiltro, nomeFiltro).subscribe({
      next: (response: PaginatedResponse<Inscricao>) => {
        this.inscricoes = response.data;
        this.totalRecords = response.meta?.total || 0;
        this.loading = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar inscrições.' });
        this.loading = false;
        console.error(err);
      }
    });
  }

  aplicarFiltros(): void {
    if (this.dtInscricoes) {
        this.dtInscricoes.first = 0;
    }
    this.carregarInscricoes({ first: 0, rows: this.dtInscricoes ? this.dtInscricoes.rows : this.rowsPerPage });
  }

  limparFiltros(): void {
    this.eventoSelecionadoFiltro = null;
    this.filtroNomeParticipante = '';
    if (this.dtInscricoes) {
        this.dtInscricoes.first = 0;
    }
    this.aplicarFiltros();
  }

  novaInscricao(): void {
    this.router.navigate(['/painel/inscricoes/novo']);
  }

  editarInscricao(codigo: number): void {
    this.router.navigate(['/painel/inscricoes/editar', codigo]);
  }

  confirmarExclusao(codigo: number): void {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir esta inscrição?',
      header: 'Confirmação de Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.excluirInscricao(codigo);
      }
    });
  }

  excluirInscricao(codigo: number): void {
    this.inscricaoService.deletarInscricaoPainel(codigo).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Inscrição excluída com sucesso!' });
        this.carregarInscricoes({ first: this.dtInscricoes ? this.dtInscricoes.first : 0, rows: this.dtInscricoes ? this.dtInscricoes.rows : this.rowsPerPage });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao excluir inscrição.' });
        console.error(err);
      }
    });
  }

  getNomeEvento(evento?: Evento): string {
    return evento?.descricao || 'N/D';
  }

  getNomeParticipante(participante?: Participante): string {
    return participante?.nome || 'N/D';
  }

  isCortesia(inscricao: Inscricao): boolean {
    return inscricao.cortesia === true;
  }
} 