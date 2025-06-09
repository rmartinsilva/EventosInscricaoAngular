export interface Participante {
  codigo: number;
  nome: string;
  cpf: string;
  email?: string;
  data_nascimento: string; // Ou Date, dependendo de como você prefere manipular
  nome_contato_emergencia: string;
  numero_contato_emergencia: string;
  telefone: string;
  sexo: 'M' | 'F'; // ou string, se houver outras opções
  cidade: string;
  participante_igreja: boolean;
  qual_igreja?: string;
  usa_medicamento: boolean;
  qual_medicamento?: string;
} 