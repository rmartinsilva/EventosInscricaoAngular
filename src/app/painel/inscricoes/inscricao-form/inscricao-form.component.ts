import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { InscricaoService } from '../../../services/inscricao.service';
import { EventoService } from '../../../services/evento.service';
import { ParticipanteService } from '../../../services/participante.service';
import { Inscricao } from '../../../shared/models/inscricao.model';
import { Evento } from '../../../shared/models/evento.model';
import { Participante } from '../../../shared/models/participante.model';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { MessageModule as PrimeNgMessageModule } from 'primeng/message';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, catchError, EMPTY, tap, of } from 'rxjs';
import { InputMaskModule } from 'primeng/inputmask';
import { MessageComponent } from '../../../shared/message/message.component';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-inscricao-form',
  templateUrl: './inscricao-form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    DropdownModule,
    InputMaskModule,
    MessageComponent,
    PrimeNgMessageModule,
    SelectModule
  ],
  providers: [MessageService]
})
export class InscricaoFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private inscricaoService = inject(InscricaoService);
  private eventoService = inject(EventoService);
  private participanteService = inject(ParticipanteService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  inscricaoForm!: FormGroup;
  isEditMode = false;
  inscricaoCodigo: number | null = null;
  eventos: Evento[] = [];
  participanteEncontrado: Participante | null = null;
  nomeParticipanteDisplay: string | null = null;
  cpfBuscaLoading = false;
  private cpfSearchSubject = new Subject<string>();
  private cpfSubscription!: Subscription;
  private eventoSubscription!: Subscription;
  private cpfControlSubscription!: Subscription;

  inscricaoExistente: Inscricao | null = null;
  mensagemStatusInscricao: string | null = null;

  eventoOfereceCortesia = false;
  numeroMaximoCortesiaEvento = 0;
  numeroCortesiaUtilizadas = 0;
  podeOferecerCortesiaNestaInscricao = false;
  mensagemCortesia: string | null = null;

  errorMessage: string | null = null;
  isSaving: boolean = false;

  constructor() { }

  get cpfDigitadoCompleto(): boolean {
    const cpfControl = this.inscricaoForm?.get('cpfParticipante');
    return !!(cpfControl && cpfControl.value && String(cpfControl.value).replace(/\D/g, '').length === 11);
  }

  ngOnInit(): void {
    const codigoParam = this.route.snapshot.params['codigo'];
    if (codigoParam) {
        this.inscricaoCodigo = +codigoParam;
        this.isEditMode = true;
    }
    this.buildForm();
    this.carregarEventos();
    
    if (this.isEditMode && this.inscricaoCodigo) {
      this.carregarInscricao(this.inscricaoCodigo);
      this.inscricaoForm.get('evento')?.disable();
      this.inscricaoForm.get('cpfParticipante')?.disable();
    } else {
      this.setupCpfSearch();
      this.setupFieldControls();
    }
  }

  ngOnDestroy(): void {
    if (this.cpfSubscription) {
      this.cpfSubscription.unsubscribe();
    }
    if (this.eventoSubscription) {
      this.eventoSubscription.unsubscribe();
    }
    if (this.cpfControlSubscription) {
      this.cpfControlSubscription.unsubscribe();
    }
  }

  buildForm(): void {
    this.inscricaoForm = this.fb.group({
      evento: [null, Validators.required],
      cpfParticipante: [{ value: '', disabled: true }, Validators.required]
    });
  }

  setupFieldControls(): void {
    this.inscricaoForm.get('cpfParticipante')?.disable();

    this.eventoSubscription = this.inscricaoForm.get('evento')?.valueChanges.subscribe(eventoSelecionado => {
      const cpfControl = this.inscricaoForm.get('cpfParticipante');

      this.participanteEncontrado = null;
      this.nomeParticipanteDisplay = null;
      this.inscricaoExistente = null;
      this.mensagemStatusInscricao = null;
      this.cpfBuscaLoading = false;
      this.cpfSearchSubject.next('');
      this.resetarControlesCortesia();
      cpfControl?.reset('');
      cpfControl?.disable();

      if (eventoSelecionado) {
        this.verificarDisponibilidadeCortesiaEvento(eventoSelecionado);
      } else {
        this.mensagemCortesia = null; 
      }
    }) || new Subscription();

    this.cpfControlSubscription = this.inscricaoForm.get('cpfParticipante')?.valueChanges.pipe(
      tap(cpf => {}),
      debounceTime(100) 
    ).subscribe(cpf => {
      if (this.inscricaoForm.get('cpfParticipante')?.enabled) {
        this.cpfSearchSubject.next(cpf || '');
      }
    }) || new Subscription();
  }

  setupCpfSearch(): void {
    this.cpfSubscription = this.cpfSearchSubject.pipe(
      distinctUntilChanged(), 
      tap((cpfValue) => {
        this.participanteEncontrado = null;
        this.inscricaoExistente = null;
        this.mensagemStatusInscricao = null;

        const cpfNumeros = (cpfValue || '').replace(/\D/g, '');

        if (cpfNumeros.length === 11) {
          this.cpfBuscaLoading = true; 
          this.nomeParticipanteDisplay = 'Buscando participante...';
        } else {
          this.cpfBuscaLoading = false; 
          if (cpfValue && cpfNumeros.length > 0 && this.inscricaoForm.get('cpfParticipante')?.enabled) { 
            this.nomeParticipanteDisplay = 'Digite o CPF completo (11 dígitos).';
          } else if (this.inscricaoForm.get('cpfParticipante')?.enabled) { 
            this.nomeParticipanteDisplay = 'Digite o CPF do participante.';
          } else { 
            this.nomeParticipanteDisplay = null;
          }
        }
      }),
      debounceTime(500), 
      switchMap(cpf => {
        const eventoSelecionado = this.inscricaoForm.get('evento')?.value;
        const cpfNumeros = (cpf || '').replace(/\D/g, '');

        if (cpfNumeros.length !== 11 || !eventoSelecionado) {
          this.cpfBuscaLoading = false; 
          if (!this.podeOferecerCortesiaNestaInscricao) {
             this.nomeParticipanteDisplay = null; 
          }
          return EMPTY;
        }
        return this.participanteService.buscarPorCpf(cpf).pipe(
          catchError(err => {
            this.cpfBuscaLoading = false;
            this.participanteEncontrado = null;
            
            if (err.status === 404) { 
                this.nomeParticipanteDisplay = 'CPF não cadastrado.';
                this.mensagemStatusInscricao = 'Este CPF não corresponde a um participante cadastrado. Por favor, realize o cadastro do participante antes de prosseguir com a inscrição cortesia.';
                this.messageService.add({ severity: 'error', summary: 'Participante Não Cadastrado', detail: this.mensagemStatusInscricao, life: 7000 });
            } else if (err.error && (err.error.error === "CPF inválido!" || err.error.message === "CPF inválido!") ) { 
                 this.nomeParticipanteDisplay = 'CPF inválido.';
                 this.mensagemStatusInscricao = 'O CPF digitado é inválido. Por favor, corrija.';
                 this.messageService.add({ severity: 'error', summary: 'CPF Inválido', detail: this.mensagemStatusInscricao });
            } else {
                this.nomeParticipanteDisplay = 'Falha ao buscar CPF.';
                this.mensagemStatusInscricao = 'Ocorreu um erro ao tentar buscar o CPF. Tente novamente.';
                this.messageService.add({ severity: 'error', summary: 'Erro na Busca', detail: this.mensagemStatusInscricao });
            }
            return EMPTY;
          })
        );
      })
    ).subscribe(participante => {
      this.cpfBuscaLoading = false;
      const eventoSelecionado = this.inscricaoForm.get('evento')?.value;
      if (participante && eventoSelecionado) {
        this.participanteEncontrado = participante;
        this.nomeParticipanteDisplay = participante.nome;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Participante encontrado: ' + participante.nome });
        if (eventoSelecionado.codigo && participante.codigo) {
          this.buscarInscricaoExistente(eventoSelecionado.codigo, participante.codigo);
        }
      } else if (participante && !eventoSelecionado) {
        this.participanteEncontrado = participante;
        this.nomeParticipanteDisplay = `Participante ${participante.nome} encontrado, mas nenhum evento selecionado.`;
      } else if (!participante) {
          if (this.nomeParticipanteDisplay === 'Buscando participante...') {
              this.nomeParticipanteDisplay = 'Não foi possível buscar o CPF.';
          }
      }
    });
  }

  buscarInscricaoExistente(eventoCodigo: number, participanteCodigo: number): void {
    this.inscricaoService.buscarInscricaoPorEventoEParticipante(eventoCodigo, participanteCodigo)
      .subscribe({
        next: (inscricao) => {
          this.inscricaoExistente = inscricao;
          this.mensagemStatusInscricao = `Este participante já está inscrito neste evento (Inscrição #${inscricao.codigo}, Status: ${inscricao.status}). Não é possível criar uma nova inscrição cortesia.`;
          this.messageService.add({ severity: 'warn', summary: 'Inscrição Existente', detail: this.mensagemStatusInscricao, life: 7000 });
        },
        error: (err) => {
          if (err.status === 404) { 
            this.inscricaoExistente = null;
            this.mensagemStatusInscricao = 'Participante habilitado para inscrição cortesia neste evento.';
            if (this.podeOferecerCortesiaNestaInscricao) {
                this.messageService.add({ severity: 'info', summary: 'Pronto para Cortesia', detail: this.mensagemStatusInscricao, life: 5000 });
            } 
          } else {
            this.mensagemStatusInscricao = 'Falha ao verificar inscrição existente.';
            this.messageService.add({ severity: 'error', summary: 'Erro na Verificação', detail: this.mensagemStatusInscricao });
          }
        }
      });
  }

  carregarEventos(): void {
    this.eventoService.getEventosAtivos().subscribe({
        next: (response: Evento[]) => this.eventos = response,
        error: (err: any) => {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar eventos ativos.' });
            console.error('Falha ao carregar eventos ativos', err);
        }
    });
  }

  carregarInscricao(codigo: number): void {
    this.isSaving = true;
    this.errorMessage = null;
    this.inscricaoService.buscarInscricaoPorCodigoPainel(codigo).subscribe({
      next: (inscricao: Inscricao) => {
        this.inscricaoForm.patchValue({
          evento: inscricao.evento,
        });
        if (inscricao.participante) {
          this.participanteEncontrado = inscricao.participante;
          this.nomeParticipanteDisplay = inscricao.participante.nome;
          this.inscricaoForm.get('cpfParticipante')?.setValue(inscricao.participante.cpf);
        }
        const eventoCorreto = this.eventos.find(e => e.codigo === inscricao.evento?.codigo);
        if (eventoCorreto) {
            this.inscricaoForm.get('evento')?.setValue(eventoCorreto);
        }
        this.isSaving = false;
      },
      error: (err: any) => {
        this.errorMessage = 'Falha ao carregar inscrição.';
        console.error(err);
        this.isSaving = false;
      }
    });
  }

  salvarInscricao(): void {
    this.errorMessage = null;
    if (!this.participanteEncontrado) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Participante não encontrado ou CPF inválido. Verifique o CPF digitado.' });
      this.inscricaoForm.get('cpfParticipante')?.markAsDirty();
      this.inscricaoForm.get('cpfParticipante')?.updateValueAndValidity(); 
      return;
    }

    if (!this.isEditMode && this.inscricaoExistente) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Este participante já está inscrito neste evento. Não é possível criar uma nova inscrição cortesia duplicada.' });
      return;
    }

    if (this.inscricaoForm.invalid) {
      this.errorMessage = 'Preencha todos os campos obrigatórios.';
      Object.values(this.inscricaoForm.controls).forEach(control => {
        if (control !== this.inscricaoForm.get('cpfParticipante')) {
            control.markAsTouched();
        }
      });
      return;
    }

    this.isSaving = true;
    const formValue = this.inscricaoForm.value;

    const inscricaoPayload: any = {
      cortesia: true,
      forma_pagamento: 'cortesia',
      status: 'C',
      evento: {
        codigo: formValue.evento?.codigo
      },
      participante: {
        codigo: this.participanteEncontrado.codigo
      }
    };
    
    if (this.isEditMode && this.inscricaoCodigo) {
      inscricaoPayload.codigo = this.inscricaoCodigo;
    }

    const operacao = this.isEditMode && this.inscricaoCodigo
      ? this.inscricaoService.atualizarInscricaoPainel(this.inscricaoCodigo, inscricaoPayload as Inscricao)
      : this.inscricaoService.criarInscricaoPainel(inscricaoPayload as Inscricao);

    operacao.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: `Inscrição ${this.isEditMode ? 'atualizada' : 'criada'} com sucesso!` });
        this.isSaving = false;
        this.router.navigate(['/painel/inscricoes']);
      },
      error: (err: any) => {
        let detailErrorMessage = `Falha ao ${this.isEditMode ? 'atualizar' : 'criar'} inscrição.`;
        if (err.error && err.error.message) {
          detailErrorMessage = err.error.message;
        } else if (err.message) {
          detailErrorMessage = err.message;
        }
        this.errorMessage = detailErrorMessage;
        console.error(err);
        this.isSaving = false;
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/painel/inscricoes']);
  }

  private resetarControlesCortesia(): void {
    this.eventoOfereceCortesia = false;
    this.numeroMaximoCortesiaEvento = 0;
    this.numeroCortesiaUtilizadas = 0;
    this.podeOferecerCortesiaNestaInscricao = false;
    this.mensagemCortesia = null;
  }

  private verificarDisponibilidadeCortesiaEvento(evento: Evento): void {
    this.resetarControlesCortesia(); 
    const cpfControl = this.inscricaoForm.get('cpfParticipante');

    if (evento && evento.cortesias && evento.numero_cortesia && evento.numero_cortesia > 0) {
      this.eventoOfereceCortesia = true;
      this.numeroMaximoCortesiaEvento = evento.numero_cortesia;

      if (!evento.codigo) {
        this.messageService.add({ severity: 'error', summary: 'Erro de Dados', detail: 'Evento selecionado não possui um código para verificar cortesias.'});
        this.mensagemCortesia = "Erro ao obter código do evento para verificar cortesias.";
        cpfControl?.disable();
        return;
      }

      this.inscricaoService.buscarNumeroInscricoesCortesiaPorEvento(evento.codigo).subscribe({
        next: (res) => {
          this.numeroCortesiaUtilizadas = res.count;
          if (this.numeroCortesiaUtilizadas < this.numeroMaximoCortesiaEvento) {
            this.podeOferecerCortesiaNestaInscricao = true;
            this.mensagemCortesia = `Cortesias disponíveis: ${this.numeroMaximoCortesiaEvento - this.numeroCortesiaUtilizadas}. Inscrição será registrada como cortesia.`;
            cpfControl?.enable();
            if (this.participanteEncontrado && !this.inscricaoExistente) {
                 this.mensagemStatusInscricao = 'Participante habilitado para inscrição cortesia neste evento.';
            }
          } else {
            this.podeOferecerCortesiaNestaInscricao = false;
            this.mensagemCortesia = 'Todas as cortesias para este evento já foram utilizadas.';
            cpfControl?.disable();
            this.messageService.add({ severity: 'warn', summary: 'Cortesias Esgotadas', detail: this.mensagemCortesia, life: 6000});
          }
        },
        error: (err) => {
          console.error('Erro ao buscar número de cortesias utilizadas', err);
          this.messageService.add({ severity: 'error', summary: 'Erro Cortesias', detail: 'Não foi possível verificar a disponibilidade de cortesias.' });
          this.podeOferecerCortesiaNestaInscricao = false;
          this.mensagemCortesia = 'Falha ao verificar disponibilidade de cortesias.';
          cpfControl?.disable();
        }
      });
    } else {
      this.eventoOfereceCortesia = false;
      this.podeOferecerCortesiaNestaInscricao = false;
      this.mensagemCortesia = 'Este evento não oferece inscrições cortesia ou não há limite definido.';
      cpfControl?.disable();
      this.messageService.add({ severity: 'info', summary: 'Sem Cortesias', detail: this.mensagemCortesia, life: 6000 });
    }
  }
} 