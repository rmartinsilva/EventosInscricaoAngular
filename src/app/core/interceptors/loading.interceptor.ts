import { HttpInterceptorFn, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { SpinnerService } from '../../shared/spinner/spinner.service';
import { finalize } from 'rxjs';

// Importar o SILENT_LOAD. Considere mover SILENT_LOAD para um arquivo de tokens compartilhado no futuro.
// Exemplo: import { SILENT_LOAD } from '../tokens/http-context-tokens';
// Por agora, vamos assumir que está acessível ou ajustar a importação conforme sua estrutura.
// Se o pagamento.service.ts estiver em ../../services/pagamento.service.ts
import { SILENT_LOAD } from '../../services/pagamento.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  // Ignora requisições para assets
  if (req.url.includes('/assets/')) {
    return next(req);
  }

  // Verifica se a requisição deve ser silenciosa
  if (req.context.get(SILENT_LOAD) === true) {
    return next(req); // Não mostra o spinner para requisições silenciosas
  }

  const spinnerService = inject(SpinnerService);
  spinnerService.show();

  return next(req).pipe(
    finalize(() => {
      spinnerService.hide();
    })
  );
}; 