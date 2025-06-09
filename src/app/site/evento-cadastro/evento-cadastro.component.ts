import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventoService } from '../../services/evento.service';
import { ParticipanteService } from '../../services/participante.service';
import { PagamentoService } from '../../services/pagamento.service';
import { InscricaoService } from '../../services/inscricao.service';
import { ListaEsperaService } from '../../services/lista-espera.service';
import { Evento } from '../../shared/models/evento.model';
import { Participante } from '../../shared/models/participante.model';
import { Inscricao } from '../../shared/models/inscricao.model';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule } from '@angular/common';
import { StepperModule } from 'primeng/stepper';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap, takeWhile, finalize, delay, takeUntil } from 'rxjs/operators';
import { Subject, EMPTY, of, timer, Subscription } from 'rxjs';
import * as cardValidator from 'card-validator';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { ListaEspera, CriarListaEsperaPayload } from '../../shared/models/lista-espera.model';
import { format, parseISO } from 'date-fns';

declare var MercadoPago: any;

@Component({
  selector: 'app-evento-cadastro',
  templateUrl: './evento-cadastro.component.html',
  styleUrls: ['./evento-cadastro.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ProgressSpinnerModule,
    StepperModule,
    ReactiveFormsModule,
    InputTextModule,
    InputMaskModule,
    DatePickerModule,
    SelectModule,
    CheckboxModule,
    ButtonModule,
    ToastModule,
    MessageModule
  ],
  providers: [MessageService]
})
export class EventoCadastroComponent implements OnInit, OnDestroy {
  evento: Evento | null = null;
  loading = true;
  error: string | null = null;
  router = inject(Router);
  activeStep: number = 1;
  selectedPaymentMethod: 'pix' | 'card' | null = null;
  participanteForm: FormGroup;
  cardPaymentForm: FormGroup;
  participanteEncontrado: Participante | null = null;
  inscricaoExistente: Inscricao | null = null;
  participanteJaInscrito: boolean = false;
  participanteListaEspera: boolean = false;
  participanteNaListaDeEspera: boolean = false;
  mostrarBotaoEntrarListaEspera: boolean = false;
  mensagemListaDeEspera: string | null = null;
  textoBotaoPrincipal: string = 'Salvar e Ir para Pagamento';
  mensagemInscricaoExistente: string | null = null;
  cpfSearchSubject = new Subject<string>();
  cpfLoading = false;
  canEditDetails = false;
  detectedCardBrand: string | null = null;
  mp: any; 
  identificationTypes: any[] = []; 
  pixGeradoDados: any | null = null; 
  pixExpirationDate: string | null = null;
  pixExpirationDateTime: Date | null = null;
  pixRequestLoading = false;
  pixPagamentoId: string | null = null;
  numeroInscricao: number | null = null;
  numeroMaximoInscricoes: number | null = null;
  isPollingPixStatus: boolean = false;
  private pixPollingSubscription?: Subscription;
  private stopPixPolling$ = new Subject<void>();
  private pagamentoService = inject(PagamentoService);
  private listaEsperaService = inject(ListaEsperaService);
  private inscricaoService = inject(InscricaoService);
  codigoListaEspera: number | null = null;

  private readonly PIX_POLLING_INTERVAL = 5000;
  private readonly PIX_POLLING_TIMEOUT_DURATION = 10 * 60 * 1000; //10 minutos

  constructor(
    private route: ActivatedRoute,
    private eventoService: EventoService,
    private participanteService: ParticipanteService,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.participanteForm = this.fb.group({
      cpf: ['', [Validators.required]],
      nome: [{ value: '', disabled: true }, [Validators.required]],
      email: [{ value: '', disabled: true }, [Validators.email]],
      data_nascimento: [{ value: null, disabled: true }, [Validators.required]],
      nome_contato_emergencia: [{ value: '', disabled: true }, [Validators.required]],
      numero_contato_emergencia: [{ value: '', disabled: true }, [Validators.required]],
      telefone: [{ value: '', disabled: true }, [Validators.required]],
      sexo: [{ value: '', disabled: true }, [Validators.required]],
      cidade: [{ value: '', disabled: true }, [Validators.required]],
      participante_igreja: [{ value: false, disabled: true }],
      qual_igreja: [{ value: '', disabled: true }], 
      usa_medicamento: [{ value: false, disabled: true }],
      qual_medicamento: [{ value: '', disabled: true }]
    });

    this.cardPaymentForm = this.fb.group({
      cardNumber: ['', [Validators.required, this.validateCardNumber.bind(this)]],
      cardExpiry: ['', [Validators.required, this.validateCardExpiry.bind(this)]],
      cardCvc: ['', [Validators.required, this.validateCardCvc.bind(this)]],
      cardHolderName: ['', [Validators.required]],
      cardholderDocType: ['CPF', [Validators.required]],
      cardholderDocNumber: ['', [Validators.required, this.validateCPF]]
    });

    this.cpfSearchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      tap(() => {
        this.resetParticipantAndInscriptionState();
        this.disableFormFields(); 
        this.canEditDetails = false;
        this.cpfLoading = true;
      }),
      switchMap(cpfComMascara => {
        return this.participanteService.buscarPorCpf(cpfComMascara).pipe(
          tap(() => this.cpfLoading = false),
          catchError(err => {
            this.cpfLoading = false;
            if (err.error && err.error.error === "CPF inválido!") {
              this.messageService.add({ severity: 'error', summary: 'CPF Inválido', detail: 'O CPF digitado é inválido. Por favor, corrija.' });
              this.disableFormFields(); 
              this.canEditDetails = false; 
            } else if (err.status === 404) {
              this.participanteEncontrado = null; 
              this.canEditDetails = true; 
              this.enableFormFields(); 
              this.messageService.add({ severity: 'info', summary: 'Novo participante', detail: 'CPF não cadastrado. Preencha os dados.' });
  
              const currentCpfValue = this.participanteForm.get('cpf')?.value; 
              this.participanteForm.reset(); 
              this.participanteForm.get('cpf')?.setValue(currentCpfValue); 
            

              if (this.eventoCarregadoComVagas()) {
                this.verificarListaEspera(); 
              }
            } else {
              this.messageService.add({ severity: 'error', summary: 'Erro ao buscar CPF', detail: err.message || 'Tente novamente.' });
              this.disableFormFields();
              this.canEditDetails = false;
            }
            return EMPTY;
          })
        );
      })
    ).subscribe({
      next: (participante) => {
        this.participanteEncontrado = participante;
        let birthDate: Date | null = null;
        if (participante.data_nascimento) {
          const parts = participante.data_nascimento.split('-');
          if (parts.length === 3) {
            birthDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          }
        }
        const cpfValue = this.participanteForm.get('cpf')?.value;
        
        this.canEditDetails = true; 
        this.participanteForm.patchValue({
          ...participante,
          cpf: cpfValue,
          data_nascimento: birthDate
        });
        this.enableFormFields();
        this.participanteForm.markAsPristine();
        this.messageService.add({ severity: 'info', summary: 'Participante encontrado', detail: 'Os dados foram preenchidos. Verifique e continue.' });

        if (this.evento && this.evento.codigo && this.participanteEncontrado.codigo) {
          this.buscarInscricaoExistente(this.evento.codigo, this.participanteEncontrado.codigo);
        }
      }
    });
  }

  ngOnInit(): void {
    this.disableFormFields();
    this.initializeMercadoPagoSDK();

    this.route.params.subscribe(params => {
      const urlEvento = params['urlEvento'];
      if (urlEvento) {
        this.carregarEvento(urlEvento);
      } else {
        this.error = 'URL do evento não encontrada';
        this.loading = false;
        this.router.navigate(['/painel/login']);
      }
    });

    this.participanteForm.get('participante_igreja')?.valueChanges.subscribe(() => this.handleConditionalFields());
    this.participanteForm.get('usa_medicamento')?.valueChanges.subscribe(() => this.handleConditionalFields());

    this.cardPaymentForm.get('cardNumber')?.valueChanges.subscribe(value => {
      const cardNumber = String(value).replace(/\s+/g, '');
      const numberValidation = cardValidator.number(cardNumber);
      this.detectedCardBrand = numberValidation.card ? numberValidation.card.type : null;
      this.cardPaymentForm.get('cardCvc')?.updateValueAndValidity(); 
    });
  }

  ngOnDestroy(): void {
    this.stopPixPolling();
    this.stopPixPolling$.next();
    this.stopPixPolling$.complete();
  }

  private resetParticipantAndInscriptionState(): void {
    this.participanteEncontrado = null;
    this.inscricaoExistente = null;
    this.participanteJaInscrito = false;
    this.participanteListaEspera = false;
    this.participanteNaListaDeEspera = false;
    this.mostrarBotaoEntrarListaEspera = false;
    this.mensagemListaDeEspera = null;
    this.textoBotaoPrincipal = 'Salvar e Ir para Pagamento';
    this.mensagemInscricaoExistente = null;
    this.stopPixPolling();
    this.codigoListaEspera = null;
    this.pixGeradoDados = null;
    this.pixExpirationDate = null;
    this.pixExpirationDateTime = null;
    this.pixPagamentoId = null;
  }

  disableFormFields(): void {
    Object.keys(this.participanteForm.controls).forEach(key => {
      if (key !== 'cpf') {
        this.participanteForm.get(key)?.disable();
      }
    });
  }

  enableFormFields(): void {
    Object.keys(this.participanteForm.controls).forEach(key => {
      if (key !== 'cpf') {
        this.participanteForm.get(key)?.enable();
      }
    });
    this.handleConditionalFields(); 
  }

  handleConditionalFields(): void {
    const participanteIgreja = this.participanteForm.get('participante_igreja')?.value;
    const usaMedicamento = this.participanteForm.get('usa_medicamento')?.value;

    if (participanteIgreja && this.canEditDetails) {
      this.participanteForm.get('qual_igreja')?.enable();
      this.participanteForm.get('qual_igreja')?.setValidators(Validators.required);
    } else {
      this.participanteForm.get('qual_igreja')?.disable();
      this.participanteForm.get('qual_igreja')?.clearValidators();
    }
    this.participanteForm.get('qual_igreja')?.updateValueAndValidity();

    if (usaMedicamento && this.canEditDetails) {
      this.participanteForm.get('qual_medicamento')?.enable();
      this.participanteForm.get('qual_medicamento')?.setValidators(Validators.required);
    } else {
      this.participanteForm.get('qual_medicamento')?.disable();
      this.participanteForm.get('qual_medicamento')?.clearValidators();
    }
    this.participanteForm.get('qual_medicamento')?.updateValueAndValidity();
  }

  async initializeMercadoPagoSDK(): Promise<void> {
    try {
      await loadMercadoPago();
      this.mp = new (window as any).MercadoPago('TEST-0ee5f147-f49e-4597-a3d0-3d45ab42ec13', {
        locale: 'pt-BR'
      });
      if (this.mp) {
        this.getIdentificationTypes();
      }
    } catch (error) {
      console.error('Erro ao inicializar o SDK do Mercado Pago:', error);
      this.messageService.add({ severity: 'error', summary: 'Erro de Integração', detail: 'Falha ao carregar o sistema de pagamento. Tente recarregar a página.' });
    }
  }

  async getIdentificationTypes(): Promise<void> {
    try {
      const identificationTypes = await this.mp.getIdentificationTypes();
      this.identificationTypes = identificationTypes.map((it: any) => ({ label: it.name, value: it.id }));
      if (!this.cardPaymentForm.get('cardholderDocType')?.value && this.identificationTypes.some(it => it.value === 'CPF')) {
         this.cardPaymentForm.get('cardholderDocType')?.setValue('CPF');
      }
    } catch (error) {
      console.error('Erro ao buscar tipos de documento:', error);
    }
  }

  validateCardNumber(control: FormControl): { [key: string]: any } | null {
    if (!control.value) return null;
    const numberValidation = cardValidator.number(String(control.value).replace(/\s+/g, ''));
    return numberValidation.isValid ? null : { 'invalidCardNumber': true };
  }

  validateCardExpiry(control: FormControl): { [key: string]: any } | null {
    if (!control.value) return null;
    const expiryValidation = cardValidator.expirationDate(String(control.value));
    return expiryValidation.isValid ? null : { 'invalidCardExpiry': true };
  }

  validateCardCvc(control: FormControl): { [key: string]: any } | null {
    if (!control.value) return null;
    const cardNumberControl = this.cardPaymentForm?.get('cardNumber');
    const cardNumber = cardNumberControl ? String(cardNumberControl.value).replace(/\s+/g, '') : '';
    const cardInfo = cardValidator.number(cardNumber);
    const cvcLength = cardInfo.card ? cardInfo.card.code.size : 3;
    const cvcValidation = cardValidator.cvv(String(control.value), cvcLength);
    return cvcValidation.isValid ? null : { 'invalidCardCvc': true };
  }

  validateCPF(control: FormControl): { [key: string]: any } | null {
    const cpf = String(control.value).replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
      return { 'invalidCPF': true };
    }
    return null;
  }

  private async generateCardToken(): Promise<string | null> {
    if (!this.mp || this.cardPaymentForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Por favor, preencha todos os dados do cartão corretamente.' });
      Object.values(this.cardPaymentForm.controls).forEach(control => control.markAsTouched());
      return null;
    }
    const cardData = this.cardPaymentForm.getRawValue();
    const [expMonth, expYear] = cardData.cardExpiry.split('/').map((s: string) => s.trim());
    const tokenPayload = {
      cardNumber: String(cardData.cardNumber).replace(/\s+/g, ''),
      cardholderName: cardData.cardHolderName,
      cardExpirationMonth: expMonth,
      cardExpirationYear: '20' + expYear,
      securityCode: cardData.cardCvc,
      identificationType: cardData.cardholderDocType,
      identificationNumber: String(cardData.cardholderDocNumber).replace(/\D/g, ''),
    };
    try {
      this.messageService.add({severity: 'info', summary: 'Processando', detail: 'Validando dados do cartão...'});
      const token = await this.mp.createCardToken(tokenPayload);  
      if (token && token.id) {
        return token.id;
      }
      this.messageService.add({ severity: 'error', summary: 'Erro de Pagamento', detail: 'Não foi possível validar os dados do cartão. Verifique as informações.' });
      return null;
    } catch (error: any) {
      console.error('Erro ao criar token do cartão:', error);
      let errorMessage = 'Falha ao processar dados do cartão.';
      if (error && error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } 
      if (error.cause && Array.isArray(error.cause)) {
        const specificError = error.cause[0];
        if (specificError && specificError.description) {
          errorMessage = specificError.description;
        } else if (specificError && specificError.code) {
          errorMessage = `Erro ${specificError.code}`;
        }
      }
      this.messageService.add({ severity: 'error', summary: 'Erro de Pagamento', detail: errorMessage });
      return null;
    }
  }

  copiarCodigoPix(): void {
    const codigoParaCopiar = this.pixGeradoDados?.qr_code;
    if (navigator.clipboard && codigoParaCopiar) {
      navigator.clipboard.writeText(codigoParaCopiar)
        .then(() => {
          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Código PIX copiado para a área de transferência!' });
        })
        .catch(err => {
          this.messageService.add({ severity: 'error', summary: 'Falha ao Copiar', detail: 'Não foi possível copiar o código PIX.' });
          console.error('Erro ao copiar código PIX:', err);
        });
    } else {
      this.messageService.add({ severity: 'warn', summary: 'Não Suportado', detail: 'Seu navegador não suporta a cópia para a área de transferência ou não há código para copiar.' });
    }
  }

  selectPaymentMethod(method: 'pix' | 'card'): void {
    this.selectedPaymentMethod = method;
    if (method === 'pix') {
      this.pixGeradoDados = null;
      this.pixExpirationDate = null;
      this.stopPixPolling();
    } else {
      this.stopPixPolling();
    }
  }

  solicitarPixPagamento(): void {
    if (!this.evento || !this.participanteEncontrado) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Dados do evento ou participante não encontrados para gerar o PIX.' });
      return;
    }
    this.pixRequestLoading = true;
    this.pixGeradoDados = null;
    this.pixExpirationDate = null;
    this.pixExpirationDateTime = null;
    this.stopPixPolling();
    this.messageService.add({ severity: 'info', summary: 'Processando', detail: 'Gerando informações do PIX...' });

    const participanteData = this.participanteForm.getRawValue();
    const nomeCompleto = participanteData.nome || '';
    const nomeParts = nomeCompleto.split(' ');
    const firstName = nomeParts[0] || '';
    const lastName = nomeParts.slice(1).join(' ') || firstName;

    const expirationDate = new Date(Date.now() + this.PIX_POLLING_TIMEOUT_DURATION); 
    
    // Formatar para YYYY-MM-DDTHH:MM:SS.mmm-03:00
    const year = expirationDate.getFullYear();
    const month = ('0' + (expirationDate.getMonth() + 1)).slice(-2);
    const day = ('0' + expirationDate.getDate()).slice(-2);
    const hours = ('0' + expirationDate.getHours()).slice(-2);
    const minutes = ('0' + expirationDate.getMinutes()).slice(-2);
    const seconds = ('0' + expirationDate.getSeconds()).slice(-2);
    const milliseconds = ('00' + expirationDate.getMilliseconds()).slice(-3);
    const timezoneOffset = '-03:00'; // Fixo -03:00

    const formattedExpirationDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${timezoneOffset}`;

    const payload = {
      evento_codigo: this.evento.codigo,
      participante_codigo: this.participanteEncontrado.codigo,
      valor: Number(this.evento.valor).toFixed(2),
      date_of_expiration: formattedExpirationDate,
      descricao_pagamento: `Inscrição ${this.evento.descricao} - ${nomeCompleto}`,
      payer: {
        email: participanteData.email,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: "CPF", 
          number: String(participanteData.cpf).replace(/\D/g, '') 
        }
      },
    };

    this.pagamentoService.gerarPix(payload).subscribe({
      next: (response) => {
        this.pixRequestLoading = false;
        if (response && response.id && response.point_of_interaction && response.point_of_interaction.transaction_data) {
          this.pixPagamentoId = response.id;
          this.pixGeradoDados = response.point_of_interaction.transaction_data;
          
          if (response.date_of_expiration) {
            try {
              // A data vem como: 2025-05-30T23:35:26.749-04:00
              const parsedDate = parseISO(response.date_of_expiration);
              this.pixExpirationDateTime = parsedDate;
              this.pixExpirationDate = format(parsedDate, 'dd/MM/yyyy HH:mm:ss');
            } catch (e) {
              console.error('Erro ao formatar data de expiração do PIX:', e);
              this.pixExpirationDate = 'Data inválida'; // Fallback
              this.pixExpirationDateTime = null;
            }
          } else {
            this.pixExpirationDate = 'Não informada';
            this.pixExpirationDateTime = null;
          }

          this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'PIX gerado! Escaneie o QR Code ou copie o código. Aguardando pagamento...' });
          this.startPixPolling(response.id);
        } else {
          console.error('Resposta da geração de PIX inválida:', response);
          this.messageService.add({ severity: 'error', summary: 'Erro ao Gerar PIX', detail: 'Não foi possível obter os dados completos do PIX. Tente novamente.' });
          this.pixPagamentoId = null;
          this.pixGeradoDados = null;
          this.pixExpirationDate = null;
          this.pixExpirationDateTime = null;
        }
      },
      error: (err) => {
        this.pixRequestLoading = false;
        this.pixExpirationDate = null;
        this.pixExpirationDateTime = null;
        console.error('Erro ao solicitar PIX:', err);
        let detailError = 'Falha ao gerar o PIX. Tente novamente.';
        if (err.error && typeof err.error === 'string') {
            detailError = err.error; 
        } else if (err.error && err.error.message) {
            detailError = err.error.message; 
        } else if (err.message) {
            detailError = err.message;
        }
        this.messageService.add({ severity: 'error', summary: 'Erro ao Gerar PIX', detail: detailError });
      }
    });
  }

  private handlePixExpired(): void {
    this.stopPixPolling();
    this.messageService.add({
      severity: 'warn',
      summary: 'PIX Expirado',
      detail: 'O código PIX anterior expirou. Você será redirecionado. Gere um novo PIX se desejar.',
      life: 7000
    });
    this.pixGeradoDados = null;
    this.pixPagamentoId = null;
    this.pixExpirationDate = null;
    this.pixExpirationDateTime = null;
    this.selectedPaymentMethod = null; 
    this.activeStep = 1;
  }

  private startPixPolling(idPagamento: string): void {
    this.stopPixPolling();
    this.isPollingPixStatus = true;
    if (this.stopPixPolling$.isStopped) {
      this.stopPixPolling$ = new Subject<void>();
    }

    this.pixPollingSubscription = timer(0, this.PIX_POLLING_INTERVAL).pipe(
      takeUntil(this.stopPixPolling$),
      tap(() => {
        if (this.pixExpirationDateTime && new Date() > this.pixExpirationDateTime) {
          this.handlePixExpired(); 
        }
      }),
      takeWhile(() => this.isPollingPixStatus && !(this.pixExpirationDateTime && new Date() > this.pixExpirationDateTime)),
      switchMap(() => {
        if (!this.isPollingPixStatus || (this.pixExpirationDateTime && new Date() > this.pixExpirationDateTime)) {
          return EMPTY;
        }
        return this.pagamentoService.verificarStatusPix(idPagamento);
      }),
      tap(statusResponse => console.log('Status PIX:', statusResponse)),
      finalize(() => {
        this.isPollingPixStatus = false;
        console.log('Polling PIX finalizado.');
      })
    ).subscribe({
      next: (statusResponse) => {
        if (!statusResponse) return;

        if (statusResponse && (statusResponse.status_pagamento_mp === 'approved' || statusResponse.status_pagamento_mp === 'CONFIRMED' || statusResponse.status_pagamento_mp === 'PAID')) {
          this.stopPixPolling();
          this.messageService.add({ severity: 'success', summary: 'Pagamento Confirmado!', detail: 'Seu pagamento PIX foi recebido.' });
          
          timer(2000).subscribe(() => {
            this.activeStep = 3;
            const linkObrigado = this.evento ? this.evento.link_obrigado : null;
            this.resetFormsAndState(true);
            if (linkObrigado) {
              if (linkObrigado.startsWith('http://') || linkObrigado.startsWith('https://')) {
                window.location.href = linkObrigado;
              } else {
                this.router.navigate([linkObrigado]); 
              }
            } else {
                this.router.navigate(['/']); 
            }
          });
        }
      },
      error: (err) => {
        console.error('Erro durante o polling do status PIX:', err);
        if (this.isPollingPixStatus) {
            this.stopPixPolling();
        }
      }
    });
  }

  private stopPixPolling(): void {
    this.stopPixPolling$.next();
    this.isPollingPixStatus = false;
    if (this.pixPollingSubscription && !this.pixPollingSubscription.closed) {
      this.pixPollingSubscription.unsubscribe();
      this.pixPollingSubscription = undefined;
    }
  }

  private verificarStatusListaEspera(eventoCodigo: number, participanteCodigo: number): void {
    this.listaEsperaService.buscarListaEsperaPorParticipanteEEvento(participanteCodigo, eventoCodigo).subscribe({
      next: (listaEsperaEntry) => {
        if (listaEsperaEntry && listaEsperaEntry.codigo) {
          this.participanteNaListaDeEspera = true;
          this.codigoListaEspera = listaEsperaEntry.codigo;
          this.participanteListaEspera = false; 
          this.mostrarBotaoEntrarListaEspera = false; 
          this.mensagemInscricaoExistente = 'Você já está na Lista de Espera para este evento.';
          this.textoBotaoPrincipal = 'Salvar Alterações'; 
        } else {
          this.participanteNaListaDeEspera = false;
          this.codigoListaEspera = null;
          this.verificarListaEspera(); 
        }
      },
      error: (err) => {
        this.participanteNaListaDeEspera = false;
        this.codigoListaEspera = null;
        if (err.status === 404) {
            this.verificarListaEspera(); 
        } else {
            console.error('Erro ao verificar status na lista de espera:', err);
            this.verificarListaEspera(); 
        }
      }
    });
  }

  private verificarListaEspera(): void {
    if (this.participanteJaInscrito || this.participanteNaListaDeEspera) {
      this.participanteListaEspera = false; 
      this.mostrarBotaoEntrarListaEspera = false;
      return; 
    }

    if (this.numeroInscricao !== null && this.numeroMaximoInscricoes !== null && 
        this.numeroInscricao >= this.numeroMaximoInscricoes) {
      this.mensagemInscricaoExistente = 'Não há mais vagas para inscrições. Você pode clicar em "Entrar na Lista de Espera" para ser notificado caso haja uma vaga disponível.';
      this.textoBotaoPrincipal = 'Salvar Dados Cadastrais'; 
      this.participanteListaEspera = true;
      this.mostrarBotaoEntrarListaEspera = true;
      this.canEditDetails = true; 
      this.enableFormFields();
    } else {
      this.participanteListaEspera = false;
      this.mostrarBotaoEntrarListaEspera = false;
      if (!this.participanteJaInscrito && !this.participanteNaListaDeEspera) {
          this.mensagemInscricaoExistente = null; 
          this.textoBotaoPrincipal = 'Salvar e Ir para Pagamento';
      }
    }
  }

  private carregarEvento(urlEvento: string): void {
    this.loading = true;
    this.error = null;
    this.eventoService.getEventoByUrl(urlEvento).subscribe({
      next: (evento) => {
        this.evento = evento;
        this.loading = false;

        if (this.evento && this.evento.codigo) {
          this.numeroMaximoInscricoes = this.evento.numero_inscricoes;
          this.inscricaoService.buscarNumeroInscricoesPorEvento(this.evento.codigo).subscribe({
            next: (numero) => {          
              this.numeroInscricao = numero.count;
              if (this.participanteEncontrado && this.participanteEncontrado.codigo && this.evento && this.evento.codigo) {
                this.buscarInscricaoExistente(this.evento.codigo, this.participanteEncontrado.codigo);
              } else if (this.canEditDetails && !this.participanteEncontrado && this.eventoCarregadoComVagas()) {
                this.verificarListaEspera();
              }
            }
          });
        }
      },
      error: (error) => {
        this.error = 'Erro ao carregar evento';
        this.loading = false;
        console.error('Erro ao carregar evento:', error);
      }
    });
  }

  private buscarInscricaoExistente(eventoCodigo: number, participanteCodigo: number): void {
    this.inscricaoService.buscarInscricaoPorEventoEParticipante(eventoCodigo, participanteCodigo).subscribe({
      next: (inscricao) => {
        let dataInscricaoFormatada = '';
        if (inscricao && inscricao.data) {
          try {
            const utcDate = new Date(inscricao.data.includes('Z') || inscricao.data.includes('+') ? inscricao.data : inscricao.data + 'Z');
            const gmtMinus3Date = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
            const year = gmtMinus3Date.getFullYear();
            const month = ('0' + (gmtMinus3Date.getMonth() + 1)).slice(-2);
            const day = ('0' + gmtMinus3Date.getDate()).slice(-2);
            dataInscricaoFormatada = `${day}/${month}/${year}`;
            inscricao.data = dataInscricaoFormatada;
          } catch (e) {
            console.error('Erro ao converter data da inscrição:', e, 'Data original:', inscricao.data);
          }
        }
        this.inscricaoExistente = inscricao;
        this.participanteJaInscrito = true;
        this.participanteListaEspera = false; 
        this.participanteNaListaDeEspera = false;
        this.textoBotaoPrincipal = 'Salvar Alterações';
        
        let detalheMensagem = 'Você já está inscrito(a) neste evento.';
        if (dataInscricaoFormatada) {
          detalheMensagem = `Você já está inscrito(a) neste evento desde ${dataInscricaoFormatada}. Você pode atualizar seus dados cadastrais abaixo, se necessário.`
        }
        this.mensagemInscricaoExistente = detalheMensagem;
 
        this.canEditDetails = true; 
        this.enableFormFields();
  
        this.messageService.add({
          severity: 'info',
          summary: 'Inscrição Existente',
          detail: detalheMensagem,
          life: 7000 
        });
      },
      error: (err) => {
        this.participanteJaInscrito = false; 
        if (err.status === 404) {
          this.inscricaoExistente = null;
          if (this.evento && this.evento.codigo && this.participanteEncontrado && this.participanteEncontrado.codigo) {
            this.verificarStatusListaEspera(this.evento.codigo, this.participanteEncontrado.codigo);
          } else {
            this.verificarListaEspera();
          }
        } else {
          this.participanteListaEspera = false; 
          this.participanteNaListaDeEspera = false;
          this.textoBotaoPrincipal = 'Salvar e Ir para Pagamento';
          this.mensagemInscricaoExistente = null;
          console.error('Erro ao buscar inscrição existente:', err);
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível verificar inscrições anteriores.' });
        }
      }
    });
  }

  onCpfChange(event: any): void {
    const cpfComMascara = event.target.value;
    const cpfNumeros = cpfComMascara.replace(/\D/g, '');

    if (cpfNumeros.length === 11) {
      this.cpfSearchSubject.next(cpfComMascara);
    } else {
      this.stopPixPolling();
      this.cpfLoading = false;
      if (this.canEditDetails || this.participanteEncontrado) {
        if (!cpfNumeros) {
          this.resetParticipantAndInscriptionState();
          this.participanteForm.reset({cpf: ''});
          this.disableFormFields();
          this.participanteForm.get('cpf')?.enable();
        }
      }
    }
  }

  avancarStep(): void {
    this.stopPixPolling();
    
    if (this.participanteListaEspera || this.participanteNaListaDeEspera) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Não é possível avançar para pagamento. Vagas esgotadas ou você já está na lista de espera.' });
      return;
    }

    if (this.numeroInscricao && this.numeroMaximoInscricoes && this.numeroInscricao >= this.numeroMaximoInscricoes && !this.participanteJaInscrito) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Não é possível avançar para o pagamento. O número máximo de inscrições foi atingido.' });
      return;
    }
    
    if (this.participanteJaInscrito) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Você já está inscrito neste evento. Não é possível avançar para o pagamento novamente. Salve quaisquer alterações nos seus dados cadastrais, se desejar.'
      });
      return;
    }
    this.activeStep = 2;
    this.selectedPaymentMethod = null;
    this.canEditDetails = false;
  }

  salvarEAvancar(): void {
    this.stopPixPolling();
    if (this.participanteForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos obrigatórios.' });
      Object.values(this.participanteForm.controls).forEach(control => control.markAsTouched());
      return;
    }
    const formValue = { ...this.participanteForm.getRawValue() };
    if (formValue.data_nascimento instanceof Date) {
      const date = formValue.data_nascimento as Date;
      formValue.data_nascimento = `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + date.getDate()).slice(-2)}`;
    }
    formValue.participante_igreja = !!formValue.participante_igreja;
    formValue.usa_medicamento = !!formValue.usa_medicamento;

    const operacaoParticipante = (this.participanteEncontrado && this.participanteEncontrado.codigo) 
      ? this.participanteService.atualizar(this.participanteEncontrado.codigo, formValue)
      : this.participanteService.criar(formValue);

    operacaoParticipante.subscribe({
      next: (participanteSalvo) => {
        this.participanteEncontrado = participanteSalvo;
        this.participanteForm.patchValue(participanteSalvo); 
        this.participanteForm.markAsPristine();

        let successSummary = 'Sucesso';
        let successDetail = '';

        if (this.participanteJaInscrito) {
          successDetail = 'Seus dados cadastrais foram atualizados com sucesso!';
        } else if (this.participanteNaListaDeEspera) {
           successDetail = 'Seus dados cadastrais (lista de espera) foram atualizados com sucesso!';
        } else if (this.participanteListaEspera) {
           successDetail = 'Dados cadastrais salvos!';
           this.mostrarBotaoEntrarListaEspera = true;
        } else {
          successDetail = this.participanteEncontrado && participanteSalvo.codigo !== this.participanteEncontrado.codigo 
            ? 'Cadastro realizado! Prossiga para o pagamento.' 
            : 'Dados atualizados! Prossiga para o pagamento.';
        }
        
        this.messageService.add({ severity: 'success', summary: successSummary, detail: successDetail });

        if (!this.participanteJaInscrito && !this.participanteListaEspera && !this.participanteNaListaDeEspera) {
          this.activeStep = 2;
          this.selectedPaymentMethod = null;
        } else {
          this.canEditDetails = true;
          this.enableFormFields(); 
        }
      },
      error: (err) => {
        let detailError = `Falha ao salvar dados do participante.`;
        if (err.error && err.error.message) {
            detailError = err.error.message;
        } else if (err.message) {
            detailError = err.message;
        }
        this.messageService.add({ severity: 'error', summary: 'Erro ao Salvar', detail: detailError });
      }
    });
  }

  entrarNaListaDeEspera(): void {
    if (!this.participanteEncontrado || !this.participanteEncontrado.codigo || !this.evento || !this.evento.codigo) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Dados do participante ou evento incompletos para entrar na lista de espera.' });
      return;
    }

    if (this.participanteForm.dirty) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Por favor, salve suas alterações cadastrais antes de entrar na lista de espera.' });
      return;
    }

    if (this.participanteNaListaDeEspera) {
      this.messageService.add({ severity: 'info', summary: 'Informação', detail: 'Você já está na lista de espera para este evento.' });
      return;
    }

    const payloadEspera: CriarListaEsperaPayload = {
      evento: { codigo: this.evento.codigo },
      participante: { codigo: this.participanteEncontrado.codigo }
    };

    this.messageService.add({ severity: 'info', summary: 'Processando', detail: 'Adicionando à lista de espera...'});

    this.listaEsperaService.salvarListaEspera(payloadEspera).subscribe({
      next: (listaEsperaCriada) => {
        this.participanteNaListaDeEspera = true;
        this.codigoListaEspera = listaEsperaCriada.codigo;
        this.participanteListaEspera = false; 
        this.mostrarBotaoEntrarListaEspera = false; 
        this.textoBotaoPrincipal = 'Salvar Alterações'; 
        this.mensagemInscricaoExistente = 'Você foi adicionado à Lista de Espera com sucesso!';
        this.messageService.add({ severity: 'success', summary: 'Lista de Espera', detail: 'Você entrou na lista de espera com sucesso!' });
      },
      error: (errLista) => {
        console.error('Erro ao entrar na lista de espera:', errLista);
        let detailError = 'Falha ao entrar na lista de espera.';
        if (errLista.error && errLista.error.message) detailError = errLista.error.message;
        else if (errLista.message) detailError = errLista.message;
        this.messageService.add({ severity: 'error', summary: 'Erro na Lista de Espera', detail: detailError });
      }
    });
  }

  sairDaListaDeEspera(): void {
    if (!this.codigoListaEspera) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Não foi possível identificar sua entrada na lista de espera.' });
      return;
    }

    this.messageService.add({ severity: 'info', summary: 'Processando', detail: 'Removendo da lista de espera...'});

    this.listaEsperaService.removerDaListaEspera(this.codigoListaEspera).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Você foi removido da lista de espera.' });
        this.participanteNaListaDeEspera = false;
        this.codigoListaEspera = null;
        this.verificarListaEspera(); 
      },
      error: (err) => {
        console.error('Erro ao sair da lista de espera:', err);
        let detailError = 'Falha ao sair da lista de espera.';
        if (err.error && err.error.message) detailError = err.error.message;
        else if (err.message) detailError = err.message;
        this.messageService.add({ severity: 'error', summary: 'Erro ao Sair', detail: detailError });
      }
    });
  }

  goToParticipantDetails(): void {
    this.stopPixPolling();
    this.activeStep = 1;
    this.selectedPaymentMethod = null;
    this.canEditDetails = true; 
    this.enableFormFields();    
  }

  async finalizeRegistration(): Promise<void> {
    if (this.selectedPaymentMethod === 'pix' && this.isPollingPixStatus) {
        this.messageService.add({ severity: 'info', summary: 'Aguardando Pagamento', detail: 'Aguardando confirmação do pagamento PIX. Verifique a tela ou seu app do banco.' });
        return;
    }    
    if (this.selectedPaymentMethod === 'pix' && !this.isPollingPixStatus && this.pixPagamentoId) {
        this.messageService.add({ severity: 'info', summary: 'Verifique Status', detail: 'O PIX foi gerado. Se o pagamento foi feito, a confirmação será processada. Se expirou, gere um novo.' });
        return;
    }

    if (!this.selectedPaymentMethod) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione um método de pagamento.' });
      return;
    }
    
    this.messageService.add({ 
      severity: 'info', 
      summary: 'Processando Inscrição', 
      detail: `Registrando inscrição com ${this.selectedPaymentMethod}...`
    });

    if (this.selectedPaymentMethod === 'card') {
      if (this.cardPaymentForm.invalid) {
        this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Dados do cartão inválidos ou incompletos.' });
        Object.values(this.cardPaymentForm.controls).forEach(control => control.markAsTouched());
        this.messageService.clear('info');
        return;
      }
      const cardToken = await this.generateCardToken();
      if (!cardToken) {
        this.messageService.clear('info');
        return;
      }

      const participanteData = this.participanteForm.getRawValue();
      const cardData = this.cardPaymentForm.getRawValue();
      const nomeCompleto = participanteData.nome || '';

      const payload = {
        evento_codigo: this.evento?.codigo,
        participante_codigo: this.participanteEncontrado?.codigo,
        valor: Number(this.evento?.valor).toFixed(2),
        descricao_pagamento: `Inscrição ${this.evento?.descricao} - ${nomeCompleto}`,
        card_token: cardToken,
        installments: 1,
        payment_method_id: this.detectedCardBrand,
        payer: {
          email: participanteData.email,
          identification: {
            type: cardData.cardholderDocType,
            number: String(cardData.cardholderDocNumber).replace(/\\D/g, '')
          }
        }
      };

      this.pagamentoService.pagarComCartao(payload).subscribe({
        next: (response) => {
          if (response && response.status === 'approved') {
           
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Inscrição Confirmada!', 
              detail: 'Sua inscrição foi realizada com sucesso. Verifique seu e-mail para mais detalhes.' 
            });

            setTimeout(() => {
              this.activeStep = 3;
              const linkObrigado = this.evento ? this.evento.link_obrigado : null;
              this.resetFormsAndState(true);
              if (linkObrigado) {
                if (linkObrigado.startsWith('http://') || linkObrigado.startsWith('https://')) {
                  window.location.href = linkObrigado;
                } else {
                  this.router.navigate([linkObrigado]); 
                }
              } else {
                  this.router.navigate(['/']);
              }
            }, 2000); 
          } else { 
                    
            this.messageService.clear('info');
            let detailErrorMessage = 'O pagamento não foi aprovado.';
            if (response && response.status_detail) {
              switch (response.status_detail) {
                case 'cc_rejected_insufficient_amount':
                  detailErrorMessage = 'Pagamento rejeitado: Saldo insuficiente.';
                  break;
                case 'cc_rejected_bad_filled_card_number':
                case 'cc_rejected_bad_filled_date':
                case 'cc_rejected_bad_filled_security_code':
                case 'cc_rejected_bad_filled_other':
                  detailErrorMessage = 'Pagamento rejeitado: Verifique os dados do cartão (número, validade, CVV).';
                  break;
                case 'cc_rejected_call_for_authorize':
                  detailErrorMessage = 'Pagamento rejeitado: Entre em contato com o emissor do cartão para autorizar o pagamento.';
                  break;
                case 'cc_rejected_card_disabled':
                  detailErrorMessage = 'Pagamento rejeitado: Cartão desabilitado.';
                  break;
                case 'cc_rejected_high_risk':
                  detailErrorMessage = 'Pagamento rejeitado por motivos de segurança. Tente outro método ou contato o suporte.';
                  break;
                case 'cc_rejected_other_reason':
                    detailErrorMessage = 'Pagamento rejeitado pelo emissor do cartão. Tente outro cartão ou entre em contato com seu banco.';
                    break;
                default:
                  detailErrorMessage = `Pagamento ${response.status || 'não processado'}. Motivo: ${response.status_detail || 'desconhecido'}.`;
              }
            } else if (response && response.status) {
              detailErrorMessage = `O status do pagamento é: ${response.status}.`;
            }

            this.messageService.add({
              severity: 'error',
              summary: 'Falha no Pagamento',
              detail: detailErrorMessage
            });
          }
        },
        error: (err) => {
          this.messageService.clear('info');
          console.error('Erro ao processar pagamento com cartão:', err);
          let detailError = 'Falha ao processar o pagamento com cartão. Tente novamente.';
          if (err.error && typeof err.error === 'string') {
              detailError = err.error; 
          } else if (err.error && err.error.message) {
              detailError = err.error.message; 
          } else if (err.message) {
              detailError = err.message;
          }
          this.messageService.add({ severity: 'error', summary: 'Erro no Pagamento', detail: detailError });
        }
      });

    } else if (this.selectedPaymentMethod === 'pix') {
      if (!this.pixPagamentoId) { 
          this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Gere o PIX antes de tentar finalizar.' });
      } else if (this.isPollingPixStatus) {
        this.messageService.add({ severity: 'info', summary: 'Aguardando Pagamento', detail: 'A confirmação do pagamento PIX está em andamento.' });
      } else {
         this.messageService.add({ severity: 'info', summary: 'Verifique Status', detail: 'O PIX foi gerado. Se o pagamento foi feito, a confirmação será processada. Se expirou, gere um novo.' });
      }
    }
  }

  private resetFormsAndState(isPaymentSuccess: boolean = false): void {
    this.stopPixPolling();
    
    const cpfValue = this.participanteForm.get('cpf')?.value;
    this.participanteForm.reset();
    this.cardPaymentForm.reset({ cardholderDocType: 'CPF' });
    
    if (isPaymentSuccess) {
        this.participanteForm.get('cpf')?.setValue('');
    } else {
        this.participanteForm.get('cpf')?.setValue(cpfValue);
    }

    this.disableFormFields();
    this.participanteForm.get('cpf')?.enable();
    
    this.participanteEncontrado = null;
    this.inscricaoExistente = null;
    this.participanteJaInscrito = false;
    this.participanteListaEspera = false;
    this.participanteNaListaDeEspera = false;
    this.mensagemInscricaoExistente = null;
    this.textoBotaoPrincipal = 'Salvar e Ir para Pagamento';
    this.canEditDetails = false;
    this.selectedPaymentMethod = null;
    this.cpfLoading = false;
    this.pixGeradoDados = null;
    this.pixExpirationDate = null;
    this.pixExpirationDateTime = null;
    this.pixPagamentoId = null;
    this.detectedCardBrand = null;
    this.codigoListaEspera = null;
  }

  resetAndStayOnEvent(): void {
    this.stopPixPolling();
    this.activeStep = 1;
    this.participanteForm.reset();
    this.disableFormFields();
    this.participanteForm.get('cpf')?.enable();
    this.participanteForm.get('cpf')?.setValue(''); 
    this.participanteEncontrado = null;
    this.inscricaoExistente = null;
    this.participanteJaInscrito = false;
    this.participanteListaEspera = false;
    this.participanteNaListaDeEspera = false;
    this.mensagemInscricaoExistente = null;
    this.textoBotaoPrincipal = 'Salvar e Ir para Pagamento';
    this.canEditDetails = false;
    this.selectedPaymentMethod = null;
    this.cpfLoading = false;
    this.pixGeradoDados = null;
    this.pixExpirationDate = null;
    this.pixExpirationDateTime = null;
    this.pixPagamentoId = null;
    this.detectedCardBrand = null;
    this.codigoListaEspera = null;
  }

  navigateToEventList(): void {
    this.stopPixPolling();
    this.router.navigate(['/']); 
  }

  private eventoCarregadoComVagas(): boolean {
    return !!(this.evento && this.evento.codigo && this.numeroInscricao !== null && this.numeroMaximoInscricoes !== null);
  }
} 