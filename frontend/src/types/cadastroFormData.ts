export type TipoCadastro = "comprador" | "vendedor";

export type TipoDocumentoFiscalCadastro = "1" | "2";

export type CadastroFormData = {
  tipoCadastro: TipoCadastro;
  nomeCompleto: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  cpf: string;
  telefone: string;
  dataNascimento: string;
  nomeFantasia: string;
  tipoDocumentoFiscalLoja: TipoDocumentoFiscalCadastro;
  documentoFiscalLoja: string;
  enderecoTipoLogradouro: string;
  enderecoNome: string;
  enderecoNumero: string;
  enderecoComplemento: string;
  enderecoCep: string;
  enderecoCidade: string;
  enderecoUf: string;
};

export type FormErrors = Partial<Record<keyof CadastroFormData, string>>;
