import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { MessageModule as PrimeNgMessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { NgxCurrencyDirective } from 'ngx-currency';

import { EventoService } from '../../../services/evento.service';
import { Evento } from '../../../shared/models/evento.model';
import { ErrorHandlerService } from '../../../shared/error-handler.service';
import { MessageComponent } from '../../../shared/message/message.component';

@Component({
  selector: 'app-evento-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    DatePickerModule,
    InputNumberModule,
    CheckboxModule,
    ButtonModule,
    PrimeNgMessageModule, 
    ToastModule,
    MessageComponent,
    NgxCurrencyDirective
  ],
  templateUrl: './evento-form.component.html'
  // providers: [MessageService] // Global
})
export class EventoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private eventoService = inject(EventoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private errorHandlerService = inject(ErrorHandlerService);

  eventoForm!: FormGroup;
  evento: Evento | null = null;
  eventoCodigo: number | null = null;
  isEditMode = false;
  isLoading = false;
  errorMessage: string | null = null;

  // Para controlar a exibição de numero_cortesia
  showNumeroCortesia = false;

  ngOnInit(): void {
    this.initializeForm();

    const codigoParam = this.route.snapshot.paramMap.get('codigo');
    if (codigoParam) {
        this.eventoCodigo = +codigoParam;
        this.isEditMode = true;
        this.loadEvento(this.eventoCodigo);
    } else {
        this.isEditMode = false;
    }

    this.eventoForm.get('cortesias')?.valueChanges.subscribe(value => {
      this.showNumeroCortesia = value;
      const numeroCortesiaControl = this.eventoForm.get('numero_cortesia');
      if (value) {
        numeroCortesiaControl?.setValidators(Validators.required);
      } else {
        numeroCortesiaControl?.clearValidators();
        numeroCortesiaControl?.setValue(null);
      }
      numeroCortesiaControl?.updateValueAndValidity();
    });
  }

  private initializeForm(): void {
    this.eventoForm = this.fb.group({
      descricao: ['', [Validators.required, Validators.minLength(5)]],
      data: [null, Validators.required],
      data_inicio_inscricoes: [null, Validators.required],
      data_final_inscricoes: [null, Validators.required],
      numero_inscricoes: [null, [Validators.required, Validators.min(1)]],
      cortesias: [false],
      numero_cortesia: [null],
      link_obrigado: ['', [Validators.required, Validators.pattern('https?://.+')]],
      url: ['', [Validators.required, Validators.pattern('https?://.+')]],
      valor: [null, [Validators.required]]
    });
  }

  private loadEvento(codigo: number): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.eventoService.getEvento(codigo).subscribe({
      next: (apiEventoData) => {
        this.evento = apiEventoData;
        const processedDataForForm = {
          ...apiEventoData,
          data: apiEventoData.data ? new Date(this.convertToLocaleSafeDateString(apiEventoData.data)) : null,
          data_inicio_inscricoes: apiEventoData.data_inicio_inscricoes ? new Date(this.convertToLocaleSafeDateString(apiEventoData.data_inicio_inscricoes)) : null,
          data_final_inscricoes: apiEventoData.data_final_inscricoes ? new Date(this.convertToLocaleSafeDateString(apiEventoData.data_final_inscricoes)) : null,
          valor: (apiEventoData.valor !== null && apiEventoData.valor !== undefined)
                 ? parseFloat(String(apiEventoData.valor))
                 : null,
        };
        this.eventoForm.patchValue(processedDataForForm);
        this.showNumeroCortesia = apiEventoData.cortesias;
        this.isLoading = false;
        this.eventoForm.markAsPristine();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.errorHandlerService.formatErrorMessages(err, 'Erro ao carregar evento.');
        this.router.navigate(['/painel/eventos']);
      }
    });
  }

  private convertToLocaleSafeDateString(dateString: string): string {
    if (dateString && dateString.length === 10 && !dateString.includes('T')) {
      return dateString + 'T00:00:00';
    }
    return dateString.replace('Z','');
  }

  onSubmit(): void {
    if (this.eventoForm.invalid) {
      this.eventoForm.markAllAsTouched();
      this.errorMessage = 'Preencha todos os campos obrigatórios corretamente.';
      this.scrollToFirstInvalidControl();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    const formValues = this.eventoForm.value;

    // Primeiro, processar o valor para ser um número ou null
    let valorNumerico: number | null = null;
    if (formValues.valor !== null && formValues.valor !== undefined && formValues.valor !== '') {
      const valorStringLimpo = String(formValues.valor).replace(/[^0-9,.]/g, ''); // Remove R$, espaços, etc.
      const valorFormatadoParaNumero = valorStringLimpo.replace(/[.]/g, '').replace(',', '.'); // Troca milhar por nada, e vírgula por ponto
      valorNumerico = parseFloat(valorFormatadoParaNumero);
      if (isNaN(valorNumerico)) {
        valorNumerico = null; // Se não for um número válido, define como null
      }
    }

    const payload: Partial<Evento> = {
      ...formValues,
      data: this.formatDateToYYYYMMDD(formValues.data),
      data_inicio_inscricoes: this.formatDateTimeToYYYYMMDDHHMMSS(formValues.data_inicio_inscricoes),
      data_final_inscricoes: this.formatDateTimeToYYYYMMDDHHMMSS(formValues.data_final_inscricoes),
      url_evento: formValues.url, 
      valor: valorNumerico !== null ? parseFloat(valorNumerico.toFixed(2)) : null, // Garante duas casas decimais se não for nulo
    };
    
    if (!payload.cortesias) {
      payload.numero_cortesia = null;
    }

    const operation$ = this.isEditMode && this.eventoCodigo
      ? this.eventoService.updateEvento(this.eventoCodigo, payload)
      : this.eventoService.createEvento(payload as Omit<Evento, 'codigo'>);

    operation$.subscribe({
      next: (savedEvento) => {
        this.isLoading = false;
        this.messageService.add({ 
          severity: 'success',
          summary: 'Sucesso',
          detail: `Evento ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`
        });
        this.eventoForm.markAsPristine();
        if (!this.isEditMode && savedEvento.codigo) {
          this.router.navigate(['/painel/eventos/editar', savedEvento.codigo]);
        } else if (this.isEditMode && savedEvento.codigo) {
          this.loadEvento(savedEvento.codigo);
        }
        this.errorMessage = null; 
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.errorHandlerService.formatErrorMessages(err, 'Erro ao salvar evento.');
      }
    });
  }

  private formatDateToYYYYMMDD(date: Date | string | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  private formatDateTimeToYYYYMMDDHHMMSS(date: Date | string | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    const hours = ('0' + d.getHours()).slice(-2);
    const minutes = ('0' + d.getMinutes()).slice(-2);
    const seconds = ('0' + d.getSeconds()).slice(-2);
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  cancel(): void {
    this.router.navigate(['/painel/eventos']);
  }

  private scrollToFirstInvalidControl(): void {
    const firstInvalidControl = document.querySelector('input.ng-invalid, textarea.ng-invalid, p-inputnumber.ng-invalid .p-inputtext, p-datepicker.ng-invalid .p-inputtext');
    if (firstInvalidControl) {
      (firstInvalidControl as HTMLElement).focus();
      (firstInvalidControl as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
} 