import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule as PrimeNgMessageModule } from 'primeng/message';
import { GrupoService } from '../../../services/grupo.service';
import { Grupo } from '../../../shared/models/grupo.model';
import { MessageComponent } from '../../../shared/message/message.component';
import { AuthService } from '../../../services/auth.service';
import { ErrorHandlerService } from '../../../shared/error-handler.service';

@Component({
  selector: 'app-grupo-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
    MessageComponent,
    PrimeNgMessageModule
  ],
  templateUrl: './grupo-form.component.html'
})
export class GrupoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private grupoService = inject(GrupoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  authService = inject(AuthService);
  private errorHandlerService = inject(ErrorHandlerService);

  form!: FormGroup;
  grupoId: number | null = null;
  isLoading: boolean = false;
  errorResponse: any = null;
  errorMessage: string | null = null;

  get isEditMode(): boolean {
    return this.grupoId !== null;
  }

  ngOnInit(): void {
    this.grupoId = this.route.snapshot.params['id'] ? +this.route.snapshot.params['id'] : null;

    this.form = this.fb.group({
      descricao: ['', Validators.required]
    });

    if (this.isEditMode && this.grupoId) {
      if (!this.authService.hasPermission('update_grupos')) {
        this.messageService.add({ severity: 'error', summary: 'Acesso Negado', detail: 'Você não tem permissão para editar grupos.'});
        this.router.navigate(['/painel/grupos']);
        return;
      }
      this.loadGrupo(this.grupoId);
    } else {
      if (!this.authService.hasPermission('create_grupos')) {
        this.messageService.add({ severity: 'error', summary: 'Acesso Negado', detail: 'Você não tem permissão para criar grupos.'});
        this.router.navigate(['/painel/grupos']);
        return;
      }
    }
  }

  loadGrupo(id: number): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.grupoService.getGrupoById(id).subscribe({
      next: (grupo) => {
        this.form.patchValue(grupo);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = this.errorHandlerService.formatErrorMessages(err, 'Erro ao carregar dados do grupo.');
        this.isLoading = false;
        this.router.navigate(['/painel/grupos']);
      }
    });
  }

  onSubmit(): void {
    this.errorMessage = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Object.keys(this.form.controls).forEach(field => {
        const control = this.form.get(field);
        control?.markAsDirty();
        control?.updateValueAndValidity({ onlySelf: true });
      });
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    this.isLoading = true;
    const grupoData = this.form.value;

    if (this.isEditMode && this.grupoId) {
      this.grupoService.updateGrupo(this.grupoId, grupoData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Grupo atualizado com sucesso!' });
          this.form.markAsPristine();
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = this.errorHandlerService.formatErrorMessages(err, 'Erro ao atualizar grupo.');
          this.isLoading = false;
        }
      });
    } else {
      this.grupoService.createGrupo(grupoData).subscribe({
        next: (newGrupo) => {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Grupo criado com sucesso!' });
          this.isLoading = false;
          this.router.navigate(['/painel/grupos/editar', newGrupo.id]);
        },
        error: (err) => {
          this.errorMessage = this.errorHandlerService.formatErrorMessages(err, 'Erro ao criar grupo.');
          this.isLoading = false;
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/painel/grupos']);
  }
} 