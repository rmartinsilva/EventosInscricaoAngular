import { Grupo } from "./grupo.model";
import { Usuario } from "./usuario.model";

export class GrupoUsuario {
  id?: number;
  grupo?: Grupo;
  usuario?: Usuario;
  created_at?: string | null;
  updated_at?: string | null;
}