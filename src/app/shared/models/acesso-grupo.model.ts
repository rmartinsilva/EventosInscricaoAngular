import { Acesso } from './acesso.model';
import { Grupo } from './grupo.model';
 
export interface AcessoGrupo {
  id?: number;       // ID do próprio vínculo
  acesso: Acesso;    // O objeto Acesso completo
  grupo: Grupo;      // O objeto Grupo completo
} 