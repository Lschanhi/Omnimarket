import type { TipoDocumentoFiscalLoja } from "../../../Services/user/lojaService";

export type ModalAberto = "avatar" | "perfil" | "loja" | "produto" | "pedido" | "entregas" | null;

export type AvatarDestino = "usuario" | "loja";

export type PerfilFormState = {
  nome: string;
  sobrenome: string;
  email: string;
  password: string;
};

export type PerfilTelefoneFormState = {
  id?: number;
  numero: string;
  isPrincipal: boolean;
};

export type PerfilEnderecoFormState = {
  id?: number;
  tipoLogradouro: string;
  nomeEndereco: string;
  numero: string;
  complemento: string;
  cep: string;
  cidade: string;
  uf: string;
  isPrincipal: boolean;
};

export type LojaFormState = {
  nomeFantasia: string;
  tipoDocumentoFiscal: `${TipoDocumentoFiscalLoja}`;
  documentoFiscal: string;
  descricao: string;
  emailContato: string;
  ativa: boolean;
};

export type ProdutoFormState = {
  id?: number;
  nome: string;
  categoria: string;
  preco: string;
  estoque: string;
  descricao: string;
  imagemUrl: string;
  disponivel: boolean;
};

export type LojaEntregaFormState = {
  id?: number;
  tipoEntregaId: string;
  nome: string;
  valorFrete: string;
  prazoEntregaDias: string;
  observacao: string;
  ativa: boolean;
};

export type CategoriaLojaOption = {
  id: string;
  nome: string;
  totalProdutos: number;
};

export type LojaFeedbackState = {
  tone: "success" | "error";
  message: string;
};
