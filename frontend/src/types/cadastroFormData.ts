export type CadastroFormData = {
  nomeCompleto: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  cpf: string;
  telefone: string;
  dataNascimento: string;
};

export type FormErrors = Partial<Record<keyof CadastroFormData, string>>;
