# Padrões do Projeto

## Estrutura de Diretórios

```
src/
├── app/
│   ├── core/           # Serviços e interceptors globais
│   ├── shared/         # Componentes, pipes e diretivas compartilhados
│   ├── features/       # Módulos de funcionalidades
│   │   ├── auth/       # Autenticação
│   │   ├── dashboard/  # Dashboard
│   │   └── ...        # Outros módulos
│   └── layouts/        # Layouts da aplicação
```

## Padrões de Código

### Angular 19
- Utilizar a nova sintaxe de controle de fluxo:
  - `@if` ao invés de `*ngIf`
  - `@for` ao invés de `*ngFor`
  - `@switch` ao invés de `*ngSwitch`
  - `@else` para condições alternativas

### Componentes
- Nomes de componentes em PascalCase
- Sufixo 'Component' para componentes
- Sufixo 'Service' para serviços
- Sufixo 'Directive' para diretivas
- Sufixo 'Pipe' para pipes
- Sufixo 'Guard' para guards
- Sufixo 'Resolver' para resolvers

### Templates
- Utilizar PrimeNG para todos os formulários (exceto tela de login)
- Exemplo de input com PrimeNG:
```html
<input pInputText formControlName="name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="Nome Completo">
```

### Serviços
- Utilizar `providedIn: 'root'` para serviços globais
- Utilizar `providedIn: 'any'` para serviços de escopo específico
- Nomes descritivos e em inglês

### Rotas
- Lazy loading para módulos
- Guards para proteção de rotas
- Resolvers para pré-carregamento de dados

### Estado
- Utilizar Signals para gerenciamento de estado
- Serviços para lógica de negócios
- Componentes para apresentação

### Estilos
- Tailwind CSS para estilização
- Classes utilitárias do Tailwind
- Componentes do PrimeNG com customização via classes do Tailwind

### Internacionalização
- Utilizar i18n para traduções
- Arquivos de tradução em JSON
- Suporte a múltiplos idiomas

### Testes
- Testes unitários com Jest
- Testes de integração
- Testes E2E com Cypress

### Performance
- Lazy loading de módulos
- Preloading de rotas estratégicas
- Otimização de bundles
- Utilização de Signals para reatividade eficiente

### Segurança
- Validação de formulários
- Sanitização de inputs
- Proteção contra XSS
- Autenticação e autorização

### Acessibilidade
- ARIA labels
- Navegação por teclado
- Contraste adequado
- Textos alternativos

### Versionamento
- Conventional Commits
- Semantic Versioning
- Branch protection
- Code review obrigatório

## Boas Práticas

1. **Componentes**
   - Single Responsibility Principle
   - Composição sobre herança
   - Props down, events up

2. **Serviços**
   - Injeção de dependências
   - Singleton por padrão
   - Métodos assíncronos com RxJS

3. **Formulários**
   - Reactive Forms
   - Validação customizada
   - Feedback visual
   - PrimeNG para componentes de formulário

4. **Performance**
   - Change Detection OnPush
   - Lazy loading
   - Code splitting
   - Signals para reatividade

5. **Testes**
   - Test Driven Development
   - Coverage mínimo de 80%
   - Mocks e stubs
   - Testes de integração

6. **Documentação**
   - JSDoc para funções
   - README por módulo
   - Comentários explicativos
   - Documentação de APIs

## Convenções de Nomenclatura

- **Arquivos**: kebab-case
  - Exemplo: `user-profile.component.ts`
  - Exemplo: `auth.service.ts`

- **Classes**: PascalCase
  - Exemplo: `UserProfileComponent`
  - Exemplo: `AuthService`

- **Variáveis e funções**: camelCase
  - Exemplo: `getUserProfile()`
  - Exemplo: `currentUser`

- **Constantes**: UPPER_SNAKE_CASE
  - Exemplo: `MAX_RETRY_ATTEMPTS`
  - Exemplo: `DEFAULT_TIMEOUT`

- **Interfaces**: PascalCase com prefixo 'I' (opcional)
  - Exemplo: `IUserProfile` ou `UserProfile`

- **Tipos**: PascalCase
  - Exemplo: `UserRole`
  - Exemplo: `AuthState`

## Estrutura de Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Tipos:
- feat: Nova funcionalidade
- fix: Correção de bug
- docs: Documentação
- style: Formatação
- refactor: Refatoração
- test: Testes
- chore: Tarefas de manutenção

## Ferramentas e Bibliotecas

- Angular 19
- PrimeNG
- Tailwind CSS
- Jest
- Cypress
- ESLint
- Prettier
- Husky
- Conventional Commits 

## Padrões Angular
- Utilizar Angular 19 ou superior
- Componentes devem ser standalone
- Utilizar sintaxe moderna do Angular:
  - `@if` ao invés de `*ngIf`
  - `@for` ao invés de `*ngFor`

## Componentes PrimeNG
- Utilizar componentes do PrimeNG para interface
- Botões devem usar `pButton`
- Inputs devem usar `pInputText`
- Dropdowns: Utilizar `p-select` ao invés do antigo `p-dropdown` (depreciado).
- Toast para mensagens de sucesso
- Message para mensagens de erro em formulários

## Mensagens e Feedback

### Mensagens de Erro em Formulários
1. **Estrutura do Componente Message**
```html
<app-message 
  [control]="formGroup.get('field')"
  [error]="'required'"
  text="Mensagem de erro"
></app-message>
```

2. **Espaçamento**
- Adicionar `div` com classe `mt-2` para conter a mensagem
- Usar `mb-6` para espaçamento entre campos do formulário

3. **Mensagens de Erro do Backend**
```typescript
interface ErrorResponse {
  message: string;
  errors?: { [key: string]: string[] };
}
```

4. **Exibição de Erros**
- Mensagem principal no topo do formulário
- Lista de erros específicos abaixo da mensagem principal
- Repetir mensagens no final do formulário se necessário

### Mensagens de Sucesso
1. **Configuração Global no app.config.ts**
```typescript
import { MessageService } from 'primeng/api';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... outros providers
    MessageService
  ]
};
```

2. **Uso no Componente**
```typescript
export class SeuComponentComponent {
  private messageService = inject(MessageService);
  
  // Exemplo de uso
  salvar(): void {
    this.messageService.add({ 
      severity: 'success', 
      detail: 'Registro adicionado com sucesso!' 
    });
  }
}
```

3. **Template**
```html
<p-toast></p-toast>
```

Observação: O MessageService deve ser configurado apenas uma vez no app.config.ts, não sendo necessário incluí-lo nos providers de cada componente.

## Campos de Senha
1. **Estrutura HTML**
```html
<div class="relative rounded-md shadow-sm">
  <input [type]="showPassword ? 'text' : 'password'" 
         pInputText 
         formControlName="password" 
         class="block w-full rounded-md border-0 px-3 py-2 pr-10 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6" 
         placeholder="******************">
  <button type="button" 
          (click)="togglePasswordVisibility()" 
          aria-label="Mostrar/ocultar senha"
          class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700">
    <i class="pi" [ngClass]="showPassword ? 'pi-eye-slash' : 'pi-eye'"></i>
  </button>
</div>
```

2. **Componente**
```typescript
export class SeuComponentComponent {
  showPassword = false;

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
```

## Padrão de Salvamento/Atualização

### 1. Estrutura do Componente
```typescript
export class SeuFormComponent {
  private messageService = inject(MessageService);
  
  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.errorMessage = 'Por favor, preencha todos os campos obrigatórios.';
      this.errorList = undefined;
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.errorList = undefined;

    const saveOperation = this.isEditMode
      ? this.service.update(this.id, data)
      : this.service.create(data);

    saveOperation.subscribe({
      next: () => {
        this.isLoading = false;
        this.messageService.add({ 
          severity: 'success', 
          detail: this.isEditMode 
            ? 'Registro atualizado com sucesso!' 
            : 'Registro adicionado com sucesso!' 
        });
        this.form.markAsPristine();
      },
      error: (err) => {
        this.handleError(err);
        this.isLoading = false;
      }
    });
  }

  private handleError(err: any): void {
    if (err.error && typeof err.error === 'object') {
      const errorResponse = err.error as ErrorResponse;
      this.errorMessage = errorResponse.message;
      this.errorList = errorResponse.errors;
    } else {
      this.errorMessage = 'Erro ao processar a requisição.';
      this.errorList = undefined;
    }
  }
}
```

### 2. Comportamento
- Não redirecionar após salvar/atualizar
- Exibir mensagem de sucesso via Toast
- Manter usuário na página atual
- Resetar estado do formulário com `markAsPristine()`
- Tratar erros do backend de forma padronizada

### 3. Validações
- Validar formulário antes de submeter
- Marcar campos como touched ao tentar submeter com erro
- Exibir mensagens de erro específicas por campo
- Tratar erros do backend mapeando para os campos correspondentes

### 4. Loading
- Mostrar indicador de loading durante operações
- Desabilitar botão de submit durante o loading
- Limpar mensagens de erro ao iniciar nova submissão 

### Loading Spinner
1. **Configuração Global**
O loading spinner é controlado automaticamente por um interceptor HTTP que observa todas as requisições REST, exceto para assets.

2. **Componente Spinner**
```typescript
@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  template: `
    <div *ngIf="spinnerService.isLoading$ | async" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <p-progressSpinner 
        styleClass="w-12 h-12" 
        strokeWidth="4" 
        fill="var(--surface-ground)" 
        animationDuration=".5s">
      </p-progressSpinner>
    </div>
  `
})
```

3. **Serviço Spinner**
```typescript
@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.loadingSubject.asObservable();

  show() {
    this.loadingSubject.next(true);
  }

  hide() {
    this.loadingSubject.next(false);
  }
}
```

4. **Interceptor**
```typescript
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  // Ignora requisições para assets
  if (req.url.includes('/assets/')) {
    return next(req);
  }

  const spinnerService = inject(SpinnerService);
  spinnerService.show();

  return next(req).pipe(
    finalize(() => {
      spinnerService.hide();
    })
  );
};
```

Observação: O loading spinner é gerenciado automaticamente pelo interceptor, não sendo necessário controlá-lo manualmente nos componentes. 