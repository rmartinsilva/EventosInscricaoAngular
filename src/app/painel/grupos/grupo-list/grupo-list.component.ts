import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule, AsyncPipe, NgIf, NgFor } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableLazyLoadEvent, TableModule, Table } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { GrupoService } from '../../../services/grupo.service';
import { Grupo } from '../../../shared/models/grupo.model';
import { AuthService } from '../../../services/auth.service';
import { PaginatedResponse, PaginatedMeta } from '../../../shared/models/pagination.model';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-grupo-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ConfirmDialogModule,
    ButtonModule,
    TableModule,
    MessageModule,
    InputTextModule
  ],
  templateUrl: './grupo-list.component.html',
  styleUrls: ['./grupo-list.component.scss'],
  providers: [ConfirmationService]
})
export class GrupoListComponent implements OnInit {
  @ViewChild('dtGrupos') dtGrupos: Table | undefined;

  private grupoService = inject(GrupoService);
  private router = inject(Router);
  authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  grupos: Grupo[] = [];
  totalRecords: number = 0;
  isLoading = false;
  rowsPerPage: number = 5;
  private lastLazyLoadEvent: TableLazyLoadEvent = {};

  errorMessage: string | null = null;

  canCreate = this.authService.hasPermission('create_grupos');
  canEdit = this.authService.hasPermission('update_grupos');
  canDelete = this.authService.hasPermission('delete_grupos');

  ngOnInit(): void {
  }

  loadGrupos(event?: TableLazyLoadEvent): void {
    this.isLoading = true;
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
    const sortField = this.lastLazyLoadEvent.sortField as string || 'descricao';
    const sortOrder = this.lastLazyLoadEvent.sortOrder === 1 ? 'asc' : 'desc';
    const filterValue = (this.lastLazyLoadEvent.globalFilter as string) || '';

    this.rowsPerPage = perPage;

    this.grupoService.getGrupos({ 
      page: page, 
      per_page: perPage, 
      filter: filterValue, 
      sort: sortField, 
      order: sortOrder 
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.data) {
          this.grupos = response.data;
          this.totalRecords = response.meta ? response.meta.total : response.data.length;
        } else if (Array.isArray(response)) {
          this.grupos = response;
          this.totalRecords = response.length;
        } else {
          this.grupos = [];
          this.totalRecords = 0;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Falha ao carregar grupos.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: this.errorMessage || undefined });
        this.grupos = [];
        this.totalRecords = 0;
      }
    });
  }

  applyFilterGlobal(event: Event, stringVal: string) {
    if (this.dtGrupos) {
        this.dtGrupos.filterGlobal((event.target as HTMLInputElement).value, stringVal);
    }
  }

  editGrupo(id: number): void {
    this.router.navigate(['/painel/grupos/editar', id]);
  }

  deleteGrupo(id: number): void {
    if (!this.canDelete) return;

    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir este grupo?',
      header: 'Confirmação de Exclusão',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.isLoading = true;
        this.grupoService.deleteGrupo(id).subscribe({
          next: () => {
            this.isLoading = false;
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Grupo excluído com sucesso!' });
            
            let eventToReload: TableLazyLoadEvent = { ...this.lastLazyLoadEvent };
            const currentFirst = eventToReload.first ?? 0;
            const currentRows = eventToReload.rows ?? this.rowsPerPage;

            if (this.grupos.length === 1 && currentFirst > 0) {
              eventToReload.first = Math.max(0, currentFirst - currentRows);
            }
            this.loadGrupos(eventToReload);
          },
          error: (err) => {
            this.isLoading = false;
            const deleteErrorMessage = err.error?.message || 'Erro ao excluir grupo.';
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: deleteErrorMessage });
            this.loadGrupos({ ...this.lastLazyLoadEvent });
          }
        });
      },
      reject: () => {
        this.isLoading = false;
      }
    });
  }

  navigateToForm(): void {
    this.router.navigate(['/painel/grupos/novo']);
  }
} 