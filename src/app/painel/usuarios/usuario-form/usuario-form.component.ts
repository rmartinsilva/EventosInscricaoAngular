import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { UsuarioService } from '../../../services/usuario.service';
import { GrupoService } from '../../../services/grupo.service';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageComponent } from '../../../shared/message/message.component';
import { MessageModule } from 'primeng/message';
import { Usuario } from '../../../shared/models/usuario.model';
import { Grupo } from '../../../shared/models/grupo.model';
import { GrupoUsuario } from '../../../shared/models/grupousuario.model';
import { GrupousuarioService } from '../../../services/grupousuario.service';
import { ErrorHandlerService } from '../../../shared/error-handler.service';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ToastModule,
    SelectModule,
    TableModule,
    ButtonModule,
    ConfirmDialogModule,
    MessageComponent,
    MessageModule
  ],
  templateUrl: './usuario-form.component.html',
  styleUrl: './usuario-form.component.css'
})
export class UsuarioFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private usuarioService = inject(UsuarioService);
  private grupoService = inject(GrupoService);
  private grupoUsuarioService = inject(GrupousuarioService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private errorHandlerService = inject(ErrorHandlerService);

  form!: FormGroup;
  usuario: Usuario | null = null;
  errorMessage: string | null = null;
  grupos: Grupo[] = [];
  gruposDisponiveis: Grupo[] = [];
  usuarioGrupos: GrupoUsuario[] = [];
  selectedGrupo: Grupo | null = null;
  showPassword = false;

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      login: ['', [Validators.required]],
      password: ['', [Validators.minLength(6)]],
      confirmarSenha: ['']
    }, { validators: this.senhasCoincidem });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadUsuario(+id);
      this.loadGrupos();
      this.loadGruposDisponiveis(+id);
    } else {
      this.form.get('password')?.addValidators(Validators.required);
      this.form.get('confirmarSenha')?.addValidators(Validators.required);
      this.form.get('password')?.updateValueAndValidity();
      this.form.get('confirmarSenha')?.updateValueAndValidity();
    }
  }

  senhasCoincidem(form: FormGroup) {
    const passwordControl = form.get('password');
    const confirmarSenhaControl = form.get('confirmarSenha');

    if (passwordControl?.value && (passwordControl?.touched || confirmarSenhaControl?.touched)) {
      return passwordControl.value === confirmarSenhaControl?.value ? null : { senhasNaoCoincidem: true };
    }
    return null;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  loadUsuario(id: number) {
    this.usuarioService.getUsuario(id).subscribe({
      next: (usuario: Usuario) => {
        this.usuario = usuario;
        this.form.patchValue({
          name: usuario.name,
          login: usuario.login
        });
        this.loadUsuarioGrupos(usuario.id);
      },
      error: (error: any) => {
        this.errorMessage = this.errorHandlerService.formatErrorMessages(error, 'Erro ao carregar usuário');
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: this.errorMessage
        });
        this.router.navigate(['/painel/usuarios']);
      }
    });
  }

  loadGrupos() {
    this.grupoService.getAllGrupos().subscribe({
      next: (res: any) => {
        const grupos = Array.isArray(res) ? res : res.data;
        this.grupos = grupos;
      },
      error: (error: any) => {
        this.errorMessage = this.errorHandlerService.formatErrorMessages(error, 'Erro ao carregar grupos');
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: this.errorMessage
        });
      }
    });
  }

  loadGruposDisponiveis(id: number) {
    //console.log('Carregando grupos disponíveis');
    //console.log('ID do usuário:', id);
      this.grupoUsuarioService.getGruposDisponiveis(id).subscribe({
        next: (res: any) => {
          const grupos = Array.isArray(res) ? res : res.data;
          this.gruposDisponiveis = grupos;
      },
      error: (error: any) => {
        this.errorMessage = this.errorHandlerService.formatErrorMessages(error, 'Erro ao carregar grupos disponíveis');
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: this.errorMessage
          });
        }
      });
    
  }

  loadUsuarioGrupos(usuarioId: number) {
    this.grupoUsuarioService.getGruposByUsuario(usuarioId).subscribe({
      next: (res: any) => {
        const grupos = Array.isArray(res) ? res : res.data;
        //console.log('Grupos do usuário carregados:', grupos);
        this.usuarioGrupos = grupos;
      },
      error: (error: any) => {
        //console.error('Erro ao carregar grupos do usuário:', error);
        this.errorMessage = this.errorHandlerService.formatErrorMessages(error, 'Erro ao carregar grupos do usuário');
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: this.errorMessage
        });
      }
    });
  }

  addGrupo() {
    if (this.selectedGrupo && this.usuario) {
      let novoUsuarioGrupo = new GrupoUsuario();
      novoUsuarioGrupo.grupo = this.selectedGrupo;
      novoUsuarioGrupo.usuario = this.usuario;


      //console.log('Adicionando grupo:', this.selectedGrupo, 'ao usuário:', this.usuario);
      this.grupoUsuarioService.addUsuarioToGrupo(novoUsuarioGrupo).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Grupo adicionado com sucesso'
          });
          this.loadUsuarioGrupos(this.usuario!.id);
          this.loadGruposDisponiveis(this.usuario!.id);
          this.selectedGrupo = null;
        },
        error: (error: any) => {
          //console.error('Erro ao adicionar grupo:', error);
          this.errorMessage = this.errorHandlerService.formatErrorMessages(error, 'Erro ao adicionar grupo');
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: this.errorMessage
          });
        }
      });
    }
  }

  removeGrupo(grupo: GrupoUsuario) {
    //console.log('Removendo grupo:', grupo);
    if (!grupo.id) {
      //console.error('ID do grupo não encontrado');
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'ID do Vínculo Grupo-Usuário não encontrado para remoção.'});
      return;
    }


    this.confirmationService.confirm({
      message: 'Tem certeza que deseja remover este grupo?',
      accept: () => {
        if (grupo.id) {
          this.grupoUsuarioService.removeUsuarioFromGrupo(grupo.id).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Grupo removido com sucesso'
              });
              this.loadUsuarioGrupos(this.usuario!.id);
              this.loadGruposDisponiveis(this.usuario!.id);
            },
            error: (error: any) => {
              //console.error('Erro ao remover grupo:', error);
              this.errorMessage = this.errorHandlerService.formatErrorMessages(error, 'Erro ao remover grupo');
              this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: this.errorMessage
              });
            }
          });
        }

      }
    });


  }

  onSubmit(): void {
    this.errorMessage = null;
    if (this.form.invalid) {
      //console.error('Formulário inválido:', this.form.errors, this.form.value);
      this.form.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Atenção', detail: 'Formulário inválido. Verifique os campos destacados.' });
      return;
    }

    let usuarioData: any = {
      name: this.form.value.name,
      login: this.form.value.login
    };

    if (this.form.value.password) {
      usuarioData.password = this.form.value.password;
    }

    const operacao$ = this.usuario
      ? this.usuarioService.updateUsuario(this.usuario.id, usuarioData)
      : this.usuarioService.createUsuario(this.form.value);

    operacao$.subscribe({
      next: (response: Usuario) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: this.usuario ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!'
        });
        this.form.markAsPristine();
        if (!this.usuario && response && response.id) {
          this.router.navigate(['/painel/usuarios/editar', response.id]);
        }
      },
      error: (error: any) => {
        this.errorMessage = this.errorHandlerService.formatErrorMessages(error, 'Erro ao salvar usuário.');
        //this.messageService.add({ severity: 'error', summary: 'Erro', detail: this.errorMessage });
      }
    });
  }

  findGrupoDescricao(grupoId: number): string {
    const foundGroup = this.grupos.find(g => g.id === grupoId);
    return foundGroup ? foundGroup.descricao : 'Grupo não encontrado';
  }
}
