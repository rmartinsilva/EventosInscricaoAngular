import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { InscricaoService } from '../../../services/inscricao.service';
import { EventoService } from '../../../services/evento.service';
import { Inscricao } from '../../../shared/models/inscricao.model';
import { Evento } from '../../../shared/models/evento.model';
import { Participante } from '../../../shared/models/participante.model';
import { PaginatedResponse } from '../../../shared/models/pagination.model';

import { MessageService } from 'primeng/api';
import { TableModule, Table, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-relatorio-inscricoes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    TooltipModule,
    DropdownModule
  ],
  templateUrl: './relatorio-inscricoes.component.html',
  styleUrls: ['./relatorio-inscricoes.component.scss'],
  providers: [MessageService]
})
export class RelatorioInscricoesComponent implements OnInit {
  @ViewChild('dtRelatorio') dtRelatorio!: Table;

  private inscricaoService = inject(InscricaoService);
  private eventoService = inject(EventoService);
  private messageService = inject(MessageService);

  inscricoes: Inscricao[] = [];
  totalRecords: number = 0;
  loading: boolean = false;
  loadingEventos: boolean = false;

  eventosParaFiltro: Evento[] = [];
  eventoSelecionado: Evento | null = null;

  opcoesFiltroCortesia = [
    { label: 'Todos', value: null as boolean | null },
    { label: 'Sim', value: true as boolean | null },
    { label: 'Não', value: false as boolean | null }
  ];
  filtroCortesiaSelecionado: { label: string, value: boolean | null } = this.opcoesFiltroCortesia[0];

  rowsPerPageOptions = [10, 25, 50, 100];
  rows: number = 10;
  first: number = 0;

  constructor() { }

  ngOnInit(): void {
    this.carregarEventosParaFiltro();
  }

  carregarEventosParaFiltro(): void {
    this.loadingEventos = true;
    this.eventoService.getAllEventos().subscribe({ 
      next: (response: Evento[]) => {
        if (response) {
          this.eventosParaFiltro = response;
        } else {
          this.eventosParaFiltro = [];
        }
        this.loadingEventos = false;
      },
      error: (err: HttpErrorResponse) => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar eventos para filtro.' });
        console.error('Erro ao carregar eventos para filtro', err);
        this.eventosParaFiltro = [];
        this.loadingEventos = false;
      }
    });
  }

  onEventoChange(): void {
    if (this.dtRelatorio) {
      this.dtRelatorio.first = 0; 
    }
    this.first = 0;
    this.inscricoes = [];
    this.totalRecords = 0;
    if (this.eventoSelecionado) {
      this.carregarInscricoesRelatorio();
    } else {
      this.loading = false; 
    }
  }

  onCortesiaChange(): void {
     if (this.dtRelatorio) {
      this.dtRelatorio.first = 0;
    }
    this.first = 0;
    if (this.eventoSelecionado) {
      this.carregarInscricoesRelatorio();
    }
  }

  carregarInscricoesRelatorio(): void {
    if (!this.eventoSelecionado || !this.eventoSelecionado.codigo) {
      this.inscricoes = [];
      this.totalRecords = 0;
      this.loading = false; 
      return;
    }

    this.loading = true;
    const eventoCodigo = this.eventoSelecionado.codigo;
    const cortesiaFilter = this.filtroCortesiaSelecionado.value;

    this.inscricaoService.getInscricoesPorEventoRelatorio(eventoCodigo, cortesiaFilter)
      .subscribe({
        next: (response: { data: Inscricao[] }) => {
          this.inscricoes = response.data || [];
          this.totalRecords = this.inscricoes.length;
          this.loading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar inscrições do relatório.' });
          this.loading = false;
          this.inscricoes = [];
          this.totalRecords = 0;
          console.error('Erro ao carregar inscrições do relatório:', err);
        }
      });
  }

  getNomeParticipante(participante?: Participante): string {
    return participante?.nome || 'N/D';
  }
} 