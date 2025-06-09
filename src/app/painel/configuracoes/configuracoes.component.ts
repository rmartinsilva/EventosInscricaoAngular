import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { catchError, tap, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { MessageModule as PrimeNgMessageModule } from 'primeng/message';

import { ConfiguracaoService } from '../../services/configuracao.service';
import { Configuracao } from '../../shared/models/configuracao.model';
import { MessageComponent } from '../../shared/message/message.component';
import { ErrorResponse } from '../../shared/models/error-response.model';
import { ErrorHandlerService } from '../../shared/error-handler.service';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    MessageComponent,
    PrimeNgMessageModule
  ],
  templateUrl: './configuracoes.component.html'
  // providers: [MessageService] // MessageService já é provider globalmente
})
export class ConfiguracoesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private configuracaoService = inject(ConfiguracaoService);
  private messageService = inject(MessageService);
  private errorHandlerService = inject(ErrorHandlerService);

  configForm!: FormGroup;
  isLoading = false;
  isEditMode = false; // Indica se estamos editando (true) ou criando (false)
  configId: number = 1; // ID fixo para configurações

  errorMessage: string | null = null;

  // Helper para o template @for
  objectKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>;

  ngOnInit(): void {
    this.initializeForm();
    this.loadConfiguracao();
  }

  private initializeForm(): void {
    this.configForm = this.fb.group({
      descricao_api: ['', [Validators.required]],
      chave_api: ['', [Validators.required]]
    });
  }

  private loadConfiguracao(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.configuracaoService.getConfiguracao(this.configId).pipe(
      tap((config) => {
        if (config) {
          this.configForm.patchValue(config);
          this.isEditMode = true;
           // Marcamos como pristine após carregar, para habilitar/desabilitar o botão corretamente
          this.configForm.markAsPristine();
        } else {
          // Caso a API retorne null ou vazio explicitamente para indicar 'não encontrado'
          this.isEditMode = false;
        }
        this.isLoading = false;
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading = false;
        if (err.status === 404) {
          // Se a API retornar 404, significa que a configuração não existe ainda
          this.isEditMode = false;
          this.errorMessage = null; // Não é um erro, apenas não existe
        } else {
          // Outro erro de carregamento
          this.errorMessage = this.errorHandlerService.formatErrorMessages(err, 'Erro ao carregar configuração.');
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: this.errorMessage });
        }
        return throwError(() => err); // Re-lança o erro para outros handlers, se houver
      })
    ).subscribe(); // Não precisamos fazer nada no subscribe aqui
  }

  onSubmit(): void {
    if (this.configForm.invalid) {
      this.errorMessage = 'Por favor, preencha todos os campos obrigatórios.';
      this.configForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const configData = this.configForm.value as Configuracao;

    const saveOperation = this.isEditMode
      ? this.configuracaoService.updateConfiguracao(this.configId, configData)
      : this.configuracaoService.createConfiguracao(configData);

    saveOperation.pipe(
      tap((savedConfig) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: this.isEditMode ? 'Configuração atualizada com sucesso!' : 'Configuração salva com sucesso!'
        });
        this.configForm.patchValue(savedConfig);
        this.configForm.markAsPristine();
        this.isEditMode = true;
        this.configId = savedConfig.id ?? this.configId;
        this.errorMessage = null;
      }),
      catchError((err) => {
        this.isLoading = false;
        this.errorMessage = this.errorHandlerService.formatErrorMessages(err, 'Erro ao salvar configuração.');
        return throwError(() => err);
      })
    ).subscribe();
  }
} 