import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';

import { Acesso } from '../../../shared/models/acesso.model';
import { AcessoService } from '../../../services/acesso.service';
import { PaginatedResponse } from '../../../shared/models/pagination.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-acesso-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ConfirmDialogModule,
    MessageModule
  ],
  templateUrl: './acesso-list.component.html',
  styleUrls: ['./acesso-list.component.css'],
  providers: [ConfirmationService]
})
export class AcessoListComponent implements OnInit {
  @ViewChild('dt') dt: Table | undefined;

  acessos: Acesso[] = [];
  totalRecords: number = 0;
  rowsPerPage: number = 10;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  private lastLazyLoadEvent: TableLazyLoadEvent = {};

  // Permissões simuladas (substituir pela lógica real de permissões)
  canAdd: boolean = true;
  canEdit: boolean = true;
  canDelete: boolean = true;

  constructor(
    private acessoService: AcessoService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    // não carregamos na inicialização, o lazy load da tabela fará isso
  }

  loadAcessos(event: TableLazyLoadEvent): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Store the last event, ensuring defaults for first and rows if undefined
    this.lastLazyLoadEvent = {
      first: event.first ?? 0,
      rows: event.rows ?? this.rowsPerPage,
      sortField: event.sortField,
      sortOrder: event.sortOrder,
      filters: { ...(event.filters || {}) }, // Shallow copy filters
      globalFilter: event.globalFilter
    };

    const page = (this.lastLazyLoadEvent.first ?? 0) / (this.lastLazyLoadEvent.rows ?? this.rowsPerPage) + 1;
    const perPage = this.lastLazyLoadEvent.rows ?? this.rowsPerPage;
    const sortField = this.lastLazyLoadEvent.sortField as string || 'descricao';
    const sortOrder = this.lastLazyLoadEvent.sortOrder === 1 ? 'asc' : (this.lastLazyLoadEvent.sortOrder === -1 ? 'desc' : 'desc');
    
    let filterValue = '';
    if (typeof this.lastLazyLoadEvent.globalFilter === 'string') {
      filterValue = this.lastLazyLoadEvent.globalFilter;
    } else if (this.dt?.filters?.['global']) { // Check table's current global filter if not a string in event
      filterValue = (this.dt.filters['global'] as any).value || '';
    }

    this.acessoService.getAcessos(page, perPage, sortField, sortOrder, filterValue)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: PaginatedResponse<Acesso>) => {
          this.acessos = response.data;
          this.totalRecords = response.meta.total;
          this.rowsPerPage = response.meta.per_page;
        },
        error: (err) => {
          this.errorMessage = 'Erro ao carregar acessos. Tente novamente mais tarde.';
          console.error('Erro ao carregar acessos:', err);
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: this.errorMessage });
        }
      });
  }

  applyFilterGlobal($event: any, stringVal: string) {
    if (this.dt) {
        this.dt.filterGlobal(($event.target as HTMLInputElement).value, stringVal);
    }
  }

  clear(table: Table) {
    table.clear();
  }

  navigateToForm(id?: number): void {
    if (id) {
      this.router.navigate(['/painel/acessos/editar', id]);
    } else {
      this.router.navigate(['/painel/acessos/novo']);
    }
  }

  editAcesso(id: number): void {
    this.navigateToForm(id);
  }

  deleteAcesso(id: number): void {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir este acesso?',
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.isLoading = true;
        this.acessoService.deleteAcesso(id)
          .pipe(finalize(() => this.isLoading = false))
          .subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Acesso excluído com sucesso!' });
              
              if (Object.keys(this.lastLazyLoadEvent).length > 0) {
                let eventToReload: TableLazyLoadEvent = { ...this.lastLazyLoadEvent };
                const currentFirst = eventToReload.first ?? 0;
                const currentRows = eventToReload.rows ?? this.rowsPerPage;

                // If the deleted item was the only one on the current page,
                // and it's not the first page, go to the previous page.
                if (this.acessos.length === 1 && currentFirst > 0) {
                  eventToReload.first = Math.max(0, currentFirst - currentRows);
                }
                
                // Ensure global filter is correctly passed if it exists
                const currentGlobalFilterValue = (this.dt?.filters?.['global'] as any)?.value;
                if (currentGlobalFilterValue !== undefined && currentGlobalFilterValue !== null) {
                    eventToReload.globalFilter = currentGlobalFilterValue;
                } else if (this.lastLazyLoadEvent.globalFilter !== undefined && this.lastLazyLoadEvent.globalFilter !== null) {
                    eventToReload.globalFilter = this.lastLazyLoadEvent.globalFilter;
                } else {
                    eventToReload.globalFilter = ''; // Default to empty string if no filter
                }

                this.loadAcessos(eventToReload);
              } else {
                // Fallback, should ideally not be reached if table has loaded once
                if (this.dt) {
                  this.dt.reset(); 
                }
              }
            },
            error: (err) => {
              this.errorMessage = 'Erro ao excluir o acesso. Verifique se ele não está associado a outros itens.';
              this.messageService.add({ severity: 'error', summary: 'Erro', detail: this.errorMessage });
              console.error('Erro ao excluir acesso:', err);
            }
          });
      }
    });
  }
} 