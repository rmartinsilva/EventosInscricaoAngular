import { Evento } from "./evento.model";
import { Participante } from "./participante.model";

export interface Inscricao {
  codigo: number;
  evento?: Evento;
  participante?: Participante;
  data?: string;
  forma_pagamento: string;
  cortesia?: boolean;
  status: string;  
} 