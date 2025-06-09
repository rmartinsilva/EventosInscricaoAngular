import { Evento } from "./evento.model";
import { Participante } from "./participante.model";

export interface ListaEspera {
  codigo: number; // Gerado pelo backend
  evento?: Evento;
  participante?: Participante;
  data_registro?: string; // Opcional, o backend pode registrar isso automaticamente
}

// Payload para a criação do registro na lista de espera
// Ajustado para refletir o que a API espera diretamente
export interface CriarListaEsperaPayload {
  evento: { codigo: number };
  participante: { codigo: number };
} 