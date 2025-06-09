import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule, TableLazyLoadEvent, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { EventoService } from '../../../services/evento.service';
import { Evento } from '../../../shared/models/evento.model';
import { PaginatedResponse } from '../../../shared/models/pagination.model';
import { ErrorHandlerService } from '../../../shared/error-handler.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-evento-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    DatePipe
  ],
  templateUrl: './evento-list.component.html',
  styleUrls: ['./evento-list.component.css']
})
export class EventoListComponent implements OnInit {
  @ViewChild('dtEventos') dtEventos: Table | undefined;

  private eventoService = inject(EventoService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private errorHandlerService = inject(ErrorHandlerService);
  public authService = inject(AuthService);

  eventos: Evento[] = [];
  totalRecords: number = 0;
  loading: boolean = true;
  
  currentPage: number = 1;
  rowsPerPage: number = 10;
  private lastLazyLoadEvent: TableLazyLoadEvent = {};

  errorMessage: string | null = null;

  ngOnInit(): void {
  }

  loadEventos(event: TableLazyLoadEvent) {
    this.loading = true;
    this.errorMessage = null;

    this.lastLazyLoadEvent = {
      first: event?.first ?? this.lastLazyLoadEvent.first ?? 0,
      rows: event?.rows ?? this.lastLazyLoadEvent.rows ?? this.rowsPerPage,
      sortField: event?.sortField ?? this.lastLazyLoadEvent.sortField,
      sortOrder: event?.sortOrder ?? this.lastLazyLoadEvent.sortOrder,
      filters: event?.filters ?? this.lastLazyLoadEvent.filters ?? {},
      globalFilter: event?.globalFilter ?? this.lastLazyLoadEvent.globalFilter ?? ''
    };

    const page = ((this.lastLazyLoadEvent.first ?? 0) / (this.lastLazyLoadEvent.rows ?? this.rowsPerPage)) + 1;
    const perPage = this.lastLazyLoadEvent.rows ?? this.rowsPerPage;
    const filterValue = (this.lastLazyLoadEvent.globalFilter as string) || '';

    this.rowsPerPage = perPage;

    this.eventoService.getEventos(page, perPage, filterValue).subscribe({
      next: (response: PaginatedResponse<Evento>) => {
        this.eventos = response.data;
        this.totalRecords = response.meta?.total ?? response.data.length;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.errorHandlerService.formatErrorMessages(err, 'Erro ao carregar eventos.');
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: this.errorMessage });
        this.eventos = [];
        this.totalRecords = 0;
      }
    });
  }

  applyFilterGlobal(event: Event, stringVal: string) {
    if (this.dtEventos) {
        this.dtEventos.filterGlobal((event.target as HTMLInputElement).value, stringVal);
    }
  }

  navigateToNovo() {
    this.router.navigate(['/painel/eventos/novo']);
  }

  navigateToEditar(codigo: number) {
    this.router.navigate(['/painel/eventos/editar', codigo]);
  }

  confirmDelete(evento: Evento) {
    if (!evento.codigo) return;
    this.confirmationService.confirm({
      message: `Tem certeza que deseja excluir o evento "${evento.descricao}"? Esta ação não pode ser desfeita.`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, excluir',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.deleteEvento(evento.codigo!);
      }
    });
  }

  private deleteEvento(codigo: number) {
    this.loading = true;
    this.eventoService.deleteEvento(codigo).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Evento excluído com sucesso.' });
        let eventToReload: TableLazyLoadEvent = { ...this.lastLazyLoadEvent };
        const currentFirst = eventToReload.first ?? 0;
        const currentRows = eventToReload.rows ?? this.rowsPerPage;

        if (this.eventos.length === 1 && currentFirst > 0) {
          eventToReload.first = Math.max(0, currentFirst - currentRows);
        }
        this.loadEventos(eventToReload);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.errorHandlerService.formatErrorMessages(err, 'Erro ao excluir evento.');
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: this.errorMessage });
        this.loadEventos({ ...this.lastLazyLoadEvent });
      }
    });
  }
} 