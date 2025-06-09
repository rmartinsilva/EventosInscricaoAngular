import { Grupo } from "./grupo.model";
import { Usuario } from "./usuario.model";

export interface UsuarioGrupo {
  id?: number;
  grupo: Grupo;
  usuario: Usuario;
  created_at?: string | null;
  updated_at?: string | null;
}