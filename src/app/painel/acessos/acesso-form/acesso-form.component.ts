import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule as PrimeNgMessageModule } from 'primeng/message';
import { AcessoService } from '../../../services/acesso.service';
import { Acesso } from '../../../shared/models/acesso.model';
import { finalize } from 'rxjs/operators';
import { ErrorHandlerService } from '../../../shared/error-handler.service';
import { MessageComponent } from '../../../shared/message/message.component';

@Component({
  selector: 'app-acesso-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    PrimeNgMessageModule,
    MessageComponent
  ],
  templateUrl: './acesso-form.component.html'
})
export class AcessoFormComponent implements OnInit {
  acessoForm: FormGroup;
  isEditMode: boolean = false;
  acessoId: number | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  pageTitle: string = 'Novo Acesso';

  constructor(
    private fb: FormBuilder,
    private acessoService: AcessoService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private errorHandlerService: ErrorHandlerService
  ) {
    this.acessoForm = this.fb.group({
      descricao: ['', Validators.required],
      menu: ['', Validators.required],
      key: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.acessoId = +id;
        this.pageTitle = 'Editar Acesso';
        this.loadAcessoData();
      }
    });
  }

  loadAcessoData(): void {
    if (!this.acessoId) return;
    this.isLoading = true;
    this.acessoService.getAcessoById(this.acessoId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (acesso) => {
          this.acessoForm.patchValue(acesso);
        },
        error: (err) => {
          this.errorMessage = 'Erro ao carregar dados do acesso.';
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: this.errorMessage });
          console.error(err);
        }
      });
  }

  onSubmit(): void {
    if (this.acessoForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Por favor, preencha todos os campos obrigatórios.' });
      Object.values(this.acessoForm.controls).forEach(control => {
        control.markAsDirty();
        control.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    const acessoData: Acesso = this.acessoForm.value;

    if (this.isEditMode && this.acessoId) {
      this.acessoService.updateAcesso(this.acessoId, acessoData)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (updatedAcesso) => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Acesso atualizado com sucesso!' });
            this.acessoForm.markAsPristine();
          },
          error: (err) => {
            this.errorMessage = this.errorHandlerService.formatErrorMessages(err, 'Erro ao atualizar o acesso.');
            //this.messageService.add({ severity: 'error', summary: 'Erro', detail: this.errorMessage });
            console.error(err);
          }
        });
    } else {
      this.acessoService.createAcesso(acessoData)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (novoAcesso) => {
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Acesso criado com sucesso!' });
            if (novoAcesso && novoAcesso.id) {
              this.router.navigate(['/painel/acessos/editar', novoAcesso.id]);
            } else {
              this.router.navigate(['/painel/acessos']);
            }
          },
          error: (err) => {
            this.errorMessage = this.errorHandlerService.formatErrorMessages(err, 'Erro ao criar o acesso.');
            //this.messageService.add({ severity: 'error', summary: 'Erro', detail: this.errorMessage });
            console.error(err);
          }
        });
    }
  }

  goBack(): void {
    this.router.navigate(['/painel/acessos']);
  }

  get descricao() { return this.acessoForm.get('descricao'); }
  get menu() { return this.acessoForm.get('menu'); }
  get key() { return this.acessoForm.get('key'); }
} 