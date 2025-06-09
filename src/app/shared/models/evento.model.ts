export interface Evento {
  codigo?: number; // Opcional, pois não existirá ao criar um novo evento
  descricao: string;
  data: string; // Formato YYYY-MM-DD
  data_inicio_inscricoes: string; // Formato YYYY-MM-DD HH:mm:ss
  data_final_inscricoes: string; // Formato YYYY-MM-DD HH:mm:ss
  numero_inscricoes: number;
  cortesias: boolean;
  numero_cortesia?: number | null; // Pode ser nulo ou não existir se cortesias for false
  link_obrigado: string;
  url: string;
  url_evento: string;
  valor: string; // Adicionando o campo valor
  [key: string]: any; // Para outras propriedades não listadas mas que podem vir da API
} 