import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../../services/usuario.service';
import { Usuario } from '../../../shared/models/usuario.model';
import { AuthService } from '../../../services/auth.service';
import { TableLazyLoadEvent, TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { MessageService, ConfirmationService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [
    RouterModule,
    TableModule,
    ButtonModule,
    ConfirmDialogModule,
    MessageModule,
    NgIf,
    InputTextModule
  ],
  templateUrl: './usuario-list.component.html',
  styleUrl: './usuario-list.component.css',
  providers: [ConfirmationService]
})
export class UsuarioListComponent implements OnInit {
  @ViewChild('dtUsuarios') dtUsuarios: Table | undefined;

  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  usuarios: Usuario[] = [];
  totalRecords: number = 0;
  isLoading = false;
  rowsPerPage: number = 5;
  private lastLazyLoadEvent: TableLazyLoadEvent = {};

  errorMessage: string | null = null;

  canAdd = this.authService.hasPermission('create_usuarios');
  canEdit = this.authService.hasPermission('update_usuarios');
  canDelete = this.authService.hasPermission('delete_usuarios');

  ngOnInit(): void {
  }

  loadUsuarios(event?: TableLazyLoadEvent): void {
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
    const filterValue = (this.lastLazyLoadEvent.globalFilter as string) || '';

    this.rowsPerPage = perPage;

    this.usuarioService.getUsuarios(page, perPage, filterValue).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.data) {
          this.usuarios = response.data;
          this.totalRecords = response.meta?.total ?? response.data.length;
        } else {
          this.usuarios = [];
          this.totalRecords = 0;
        }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && typeof err.error.message === 'string') {
          this.errorMessage = err.error.message;
        } else if (typeof err.message === 'string') {
          this.errorMessage = err.message;
        } else {
          this.errorMessage = 'Falha ao carregar usuários.';
        }
        this.usuarios = [];
        this.totalRecords = 0;
      }
    });
  }

  applyFilterGlobal(event: Event, stringVal: string) {
    if (this.dtUsuarios) {
        this.dtUsuarios.filterGlobal((event.target as HTMLInputElement).value, stringVal);
    }
  }

  navigateToForm(): void {
    this.router.navigate(['/painel/usuarios/novo']);
  }

  editUsuario(id: number): void {
    this.router.navigate(['/painel/usuarios/editar', id]);
  }

  deleteUsuario(id: number): void {
    if (!this.canDelete) return;

    this.confirmationService.confirm({
      message: 'Tem certeza que deseja excluir este usuário?',
      header: 'Confirmação de Exclusão',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.isLoading = true;
        this.usuarioService.deleteUsuario(id).subscribe({
          next: () => {
            this.isLoading = false;
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Usuário excluído com sucesso!' });
            
            let eventToReload: TableLazyLoadEvent = { ...this.lastLazyLoadEvent };
            const currentFirst = eventToReload.first ?? 0;
            const currentRows = eventToReload.rows ?? this.rowsPerPage;

            if (this.usuarios.length === 1 && currentFirst > 0) {
              eventToReload.first = Math.max(0, currentFirst - currentRows);
            }
            this.loadUsuarios(eventToReload);
          },
          error: (err) => {
            this.isLoading = false;
            let deleteErrorMessage = 'Erro ao excluir usuário.';
            if (err.error && typeof err.error.message === 'string') {
              deleteErrorMessage = err.error.message;
            } else if (typeof err.message === 'string') {
              deleteErrorMessage = err.message;
            }
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: deleteErrorMessage });
            this.loadUsuarios({ ...this.lastLazyLoadEvent }); 
          }
        });
      },
      reject: () => {
        this.isLoading = false;
      }
    });
  }
}
