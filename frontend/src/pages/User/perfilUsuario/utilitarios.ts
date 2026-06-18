import { type UserTabOption } from "../../../Components/perfil/UserTabs";
import {
  TIPOS_ENTREGA_OPTIONS,
  type LojaEntregaOpcao,
} from "../../../Services/produtos/lojaEntregaService";
import { getStoredLojaAvatar } from "../../../Services/user/lojaAvatarStorage";
import type {
  PerfilGridItem,
  PerfilIdentityCardData,
  PerfilStatCardItem,
  PerfilTabContent,
  PerfilTabId,
  PerfilVisaoId,
  UsuarioEnderecoPerfil,
  UsuarioTelefonePerfil,
} from "../../../types/perfil";
import type {
  CategoriaLojaOption,
  LojaEntregaFormState,
  LojaFormState,
  PerfilEnderecoFormState,
  PerfilFormState,
  PerfilTelefoneFormState,
  ProdutoFormState,
} from "./tipos";
import {
  formatarCep as formatarCepComMascara,
  formatarCpfOuCnpj,
  formatarDocumentoFiscal,
  formatarMoedaDeNumero,
  formatarMoedaParaInput,
  formatarTelefone,
  normalizarCep as normalizarCepComMascara,
} from "../../../utils/masks";

export const PERFIL_FORM_INICIAL: PerfilFormState = {
  nome: "",
  sobrenome: "",
  email: "",
  password: "",
};

export const TELEFONE_FORM_INICIAL: PerfilTelefoneFormState = {
  numero: "",
  isPrincipal: false,
};

export const ENDERECO_FORM_INICIAL: PerfilEnderecoFormState = {
  tipoLogradouro: "Rua",
  nomeEndereco: "",
  numero: "",
  complemento: "",
  cep: "",
  cidade: "",
  uf: "",
  isPrincipal: false,
};

export const LOJA_FORM_INICIAL: LojaFormState = {
  nomeFantasia: "",
  tipoDocumentoFiscal: "1",
  documentoFiscal: "",
  descricao: "",
  emailContato: "",
  ativa: true,
  aceitouTermoFiscalResponsabilidade: false,
};

export const PRODUTO_FORM_INICIAL: ProdutoFormState = {
  nome: "",
  categoria: "",
  preco: "",
  estoque: "0",
  descricao: "",
  imagemUrl: "",
  disponivel: true,
};

export const LOJA_ENTREGA_FORM_INICIAL: LojaEntregaFormState = {
  tipoEntregaId: "1",
  nome: "Retirada",
  valorFrete: "0,00",
  prazoEntregaDias: "0",
  observacao: "",
  ativa: true,
};

export const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;
export const MAX_PRODUCT_IMAGE_FILE_SIZE = 2 * 1024 * 1024;

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const ABAS_DE_VISAO: UserTabOption[] = [
  { id: "comprador", label: "Comprador" },
  { id: "loja", label: "Loja" },
];

export const ABAS_DE_CONTEUDO_POR_VISAO: Record<PerfilVisaoId, UserTabOption[]> = {
  comprador: [{ id: "compras", label: "Compras" }],
  loja: [
    { id: "produtos", label: "Produtos" },
    { id: "vendas", label: "Vendas" },
  ],
};

export const METADADOS_ABAS: Record<PerfilTabId, Omit<PerfilTabContent, "itens">> = {
  produtos: {
    titulo: "Produtos da loja",
    descricao: "Gerencie os itens publicados e pausados da vitrine em um so lugar.",
    vazioTitulo: "Nenhum produto encontrado",
    vazioDescricao: "Quando houver produtos cadastrados na loja, eles aparecerao aqui.",
  },
  vendas: {
    titulo: "Desempenho de vendas",
    descricao: "Filtre os pedidos por etapa, abra os detalhes da venda e conduza o proximo status operacional.",
    vazioTitulo: "Nenhuma venda encontrada",
    vazioDescricao: "Assim que a loja tiver pedidos vinculados, eles aparecerao aqui para acompanhamento do vendedor.",
  },
  compras: {
    titulo: "Historico de compras",
    descricao: "Visualize os pedidos feitos pela sua conta de comprador.",
    vazioTitulo: "Nenhuma compra encontrada",
    vazioDescricao: "As compras vinculadas ao usuario serao exibidas aqui.",
  },
};

export function formatarMoeda(valor: number) {
  return formatadorMoeda.format(Number(valor ?? 0));
}

export function normalizarPrecoParaInput(valor?: number) {
  return formatarMoedaDeNumero(valor);
}

export function normalizarPrecoParaApi(valor: string) {
  const valorNormalizado = Number(valor.replace(/\./g, "").replace(",", "."));

  if (!Number.isFinite(valorNormalizado) || valorNormalizado < 0) {
    throw new Error("Informe um preco valido para o produto.");
  }

  return valorNormalizado;
}

export function criarCategoriaProdutoId(categoria: string) {
  return categoria
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "geral";
}

export function criarProdutoGridItem({
  categoria,
  descricao,
  disponivel,
  estoque,
  id,
  imagemUrl,
  imagens,
  nome,
  preco,
}: {
  categoria: string;
  descricao?: string;
  disponivel: boolean;
  estoque: number;
  id: number;
  imagemUrl?: string;
  imagens?: string[];
  nome: string;
  preco: number;
}): PerfilGridItem {
  const imagensNormalizadas =
    imagens?.filter((imagem) => typeof imagem === "string" && imagem.trim().length > 0) ?? [];
  const imagemPrincipal = imagemUrl?.trim() || imagensNormalizadas[0] || undefined;

  return {
    id: `produto-${id}`,
    titulo: nome,
    subtitulo: categoria,
    valor: formatadorMoeda.format(preco),
    imagemUrl: imagemPrincipal,
    badge: disponivel ? "Publicado" : "Pausado",
    produtoId: id,
    categoriaId: criarCategoriaProdutoId(categoria),
    categoriaNome: categoria,
    precoNumero: preco,
    estoque,
    disponivel,
    descricao,
    imagens: imagemPrincipal && imagensNormalizadas.length === 0 ? [imagemPrincipal] : imagensNormalizadas,
  };
}

export function normalizarFreteParaInput(valor?: number) {
  return formatarMoedaDeNumero(valor, "0,00");
}

export function normalizarFreteParaApi(valor: string, tipoEntregaId: number) {
  if (tipoEntregaId === 1) {
    return 0;
  }

  const valorNormalizado = Number(valor.replace(/\./g, "").replace(",", "."));

  if (!Number.isFinite(valorNormalizado) || valorNormalizado < 0) {
    throw new Error("Informe um valor de frete valido para a opcao de entrega.");
  }

  return valorNormalizado;
}

export function normalizarPrazoEntregaParaApi(valor: string) {
  const prazoNormalizado = Number(valor);

  if (!Number.isInteger(prazoNormalizado) || prazoNormalizado < 0 || prazoNormalizado > 365) {
    throw new Error("Informe um prazo de entrega valido entre 0 e 365 dias.");
  }

  return prazoNormalizado;
}

export function obterTipoEntregaLabel(tipoEntregaId: number | null | undefined) {
  return TIPOS_ENTREGA_OPTIONS.find((option) => option.id === tipoEntregaId)?.label ?? "Entrega";
}

export function obterNomePadraoEntrega(tipoEntregaId: number | string | null | undefined) {
  return obterTipoEntregaLabel(
    tipoEntregaId == null || tipoEntregaId === "" ? undefined : Number(tipoEntregaId),
  );
}

export function criarEntregaLojaForm(opcao?: LojaEntregaOpcao): LojaEntregaFormState {
  if (!opcao) {
    return LOJA_ENTREGA_FORM_INICIAL;
  }

  return {
    id: opcao.id,
    tipoEntregaId: String(opcao.tipoEntregaId ?? 1),
    nome: opcao.nome?.trim() || obterNomePadraoEntrega(opcao.tipoEntregaId),
    valorFrete: normalizarFreteParaInput(opcao.valorFrete),
    prazoEntregaDias: String(opcao.prazoEntregaDias ?? 0),
    observacao: opcao.observacao ?? "",
    ativa: opcao.ativa,
  };
}

export function ordenarEntregasLoja(opcoes: LojaEntregaOpcao[]) {
  return [...opcoes].sort((a, b) => {
    const tipoA = a.tipoEntregaId ?? Number.MAX_SAFE_INTEGER;
    const tipoB = b.tipoEntregaId ?? Number.MAX_SAFE_INTEGER;

    if (tipoA !== tipoB) {
      return tipoA - tipoB;
    }

    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}

export function criarProdutoForm(item?: PerfilGridItem): ProdutoFormState {
  if (!item) {
    return PRODUTO_FORM_INICIAL;
  }

  return {
    id: item.produtoId,
    nome: item.titulo,
    categoria: item.categoriaNome ?? item.subtitulo ?? "",
    preco: normalizarPrecoParaInput(item.precoNumero),
    estoque: String(item.estoque ?? 0),
    descricao: item.descricao ?? "",
    imagemUrl: item.imagens?.[0] ?? item.imagemUrl ?? "",
    disponivel: item.disponivel ?? true,
  };
}

export function criarCategoriasDaLoja(itens: PerfilGridItem[]): CategoriaLojaOption[] {
  const categorias = new Map<string, CategoriaLojaOption>();

  itens.forEach((item) => {
    const categoriaId = item.categoriaId ?? item.categoriaNome ?? item.subtitulo;
    const categoriaNome = item.categoriaNome ?? item.subtitulo;

    if (!categoriaId || !categoriaNome) {
      return;
    }

    const atual = categorias.get(categoriaId);

    if (atual) {
      atual.totalProdutos += 1;
      return;
    }

    categorias.set(categoriaId, {
      id: categoriaId,
      nome: categoriaNome,
      totalProdutos: 1,
    });
  });

  return Array.from(categorias.values()).sort((a, b) => a.nome.localeCompare(b.nome));
}

export function criarMensagemConfirmacaoExclusaoCategoria(categoria: CategoriaLojaOption) {
  return categoria.totalProdutos === 1
    ? `Deseja mesmo excluir a categoria "${categoria.nome}"? O produto vinculado deixara de aparecer para os usuarios, mas continuara salvo no banco.`
    : `Deseja mesmo excluir a categoria "${categoria.nome}"? Os ${categoria.totalProdutos} produtos vinculados deixarao de aparecer para os usuarios, mas continuarao salvos no banco.`;
}

export function criarMensagemSucessoExclusaoCategoria(
  categoria: CategoriaLojaOption,
  totalProdutosRemovidos: number,
) {
  return totalProdutosRemovidos === 1
    ? `Categoria "${categoria.nome}" removida com sucesso. O produto vinculado nao aparece mais na vitrine.`
    : `Categoria "${categoria.nome}" removida com sucesso. ${totalProdutosRemovidos} produtos deixaram de aparecer na vitrine.`;
}

export function formatarAvaliacaoMedia(avaliacaoMedia: number) {
  return avaliacaoMedia ? `${avaliacaoMedia.toFixed(1)} / 5` : "Sem nota";
}

export function formatarEnderecoLoja(
  loja: {
    nomeEndereco?: string | null;
    numeroEndereco?: string | null;
    complementoEndereco?: string | null;
    cidade?: string | null;
    uf?: string | null;
  } | null,
) {
  if (!loja?.nomeEndereco?.trim()) {
    return "";
  }

  const partes = [`${loja.nomeEndereco.trim()}, ${loja.numeroEndereco?.trim() || "S/N"}`];

  if (loja.complementoEndereco?.trim()) {
    partes.push(loja.complementoEndereco.trim());
  }

  const cidadeUf = [loja.cidade?.trim(), loja.uf?.trim()].filter(Boolean).join("/");

  if (cidadeUf) {
    partes.push(cidadeUf);
  }

  return partes.join(" - ");
}

export function criarCardComprador(
  usuario: {
    nome: string;
    email: string;
    telefone: string;
    endereco: string;
    avatarUrl?: string;
    resumo?: string;
  } | null,
  podeGerenciarLoja: boolean,
): PerfilIdentityCardData | null {
  if (!usuario) {
    return null;
  }

  return {
    rotulo: "Perfil do usuario",
    nome: usuario.nome,
    resumo: usuario.resumo || "Area pronta para bio, cargo ou descricao curta do usuario.",
    avatarUrl: usuario.avatarUrl,
    fotoHint: "Clique na foto para alterar",
    infoItems: [
      { key: "email", label: "Email", value: usuario.email },
      { key: "telefone", label: "Telefone", value: usuario.telefone },
      { key: "endereco", label: "Endereco", value: usuario.endereco },
    ],
    footerText: podeGerenciarLoja
      ? "Sua loja pode usar o endereco e o telefone principal que ja estao cadastrados no perfil."
      : "Cadastre um telefone e um endereco principal para liberar a criacao da loja.",
  };
}

export function criarCardLoja(
  loja: {
    nomeFantasia: string;
    descricao?: string | null;
    emailContato?: string | null;
    fotoPerfilUrl?: string | null;
    avatarUrl?: string | null;
    logoUrl?: string | null;
    numeroTelefone?: string | null;
    ativa: boolean;
    nomeEndereco?: string | null;
    numeroEndereco?: string | null;
    complementoEndereco?: string | null;
    cidade?: string | null;
    uf?: string | null;
  } | null,
  usuario: {
    email: string;
    telefone: string;
    endereco: string;
  } | null,
  avatarLojaUrl?: string,
): PerfilIdentityCardData | null {
  if (!loja) {
    return null;
  }

  return {
    rotulo: "Perfil da loja",
    nome: loja.nomeFantasia,
    resumo:
      loja.descricao?.trim() ||
      "Esta aba mostra a apresentacao publica e os principais dados operacionais da loja.",
    avatarUrl:
      avatarLojaUrl || loja.fotoPerfilUrl || loja.logoUrl || loja.avatarUrl || undefined,
    fotoHint: "Clique na foto para alterar a imagem da loja",
    badge: loja.ativa ? "Loja ativa" : "Loja em configuracao",
    infoItems: [
      {
        key: "email",
        label: "Email de contato",
        value: loja.emailContato?.trim() || usuario?.email || "",
      },
      {
        key: "telefone",
        label: "Telefone da loja",
        value: loja.numeroTelefone?.trim() || usuario?.telefone || "",
      },
      {
        key: "endereco",
        label: "Endereco da loja",
        value: formatarEnderecoLoja(loja) || usuario?.endereco || "",
      },
    ],
    footerText:
      "Use esta visao para revisar os dados publicos da loja e acompanhar a performance da sua vitrine.",
  };
}

export function criarStatsComprador(
  usuario: {
    telefones: Array<unknown>;
    enderecos: Array<unknown>;
  } | null,
  stats: { totalCompras: number },
): PerfilStatCardItem[] {
  return [
    {
      key: "total-compras",
      label: "Compras",
      value: `${stats.totalCompras}`,
    },
    {
      key: "telefones",
      label: "Telefones",
      value: `${usuario?.telefones.length ?? 0}`,
    },
    {
      key: "enderecos",
      label: "Enderecos",
      value: `${usuario?.enderecos.length ?? 0}`,
    },
  ];
}

export function resolverAvatarLoja(
  loja: {
    id: number;
    fotoPerfilUrl?: string | null;
    avatarUrl?: string | null;
    logoUrl?: string | null;
  } | null,
) {
  if (!loja) {
    return "";
  }

  const avatarDaApi =
    loja.fotoPerfilUrl?.trim() || loja.logoUrl?.trim() || loja.avatarUrl?.trim() || "";

  if (avatarDaApi) {
    return avatarDaApi;
  }

  return getStoredLojaAvatar(loja.id) ?? "";
}

export function criarStatsLoja(
  stats: {
    avaliacaoMedia: number;
    totalProdutos: number;
    totalVendas: number;
    faturamentoBruto: number;
    ticketMedio: number;
    totalComissaoMarketplace: number;
    totalLiquidoVendedor: number;
    quantidadePedidos: number;
  },
): PerfilStatCardItem[] {
  return [
    {
      key: "vendas-brutas",
      label: "Vendas brutas",
      value: formatarMoeda(stats.faturamentoBruto),
    },
    {
      key: "valor-liquido",
      label: "Liquido a receber",
      value: formatarMoeda(stats.totalLiquidoVendedor),
    },
  ];
}

export function lerArquivoComoDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Nao foi possivel carregar a imagem selecionada."));
    };

    reader.onerror = () => {
      reject(new Error("Nao foi possivel ler o arquivo da imagem."));
    };

    reader.readAsDataURL(file);
  });
}

export function normalizarCep(cep: string) {
  return normalizarCepComMascara(cep);
}

export function formatarCep(cep: string) {
  return formatarCepComMascara(cep);
}

export function telefoneTemConteudo(telefone: PerfilTelefoneFormState | null) {
  return Boolean(telefone?.numero.trim());
}

export function normalizarTelefoneParaComparacao(telefone: string) {
  return telefone.replace(/\D/g, "");
}

function normalizarTextoEnderecoParaComparacao(valor: string | undefined) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function criarChaveComparacaoEndereco(endereco: PerfilEnderecoFormState) {
  return [
    normalizarTextoEnderecoParaComparacao(endereco.tipoLogradouro),
    normalizarTextoEnderecoParaComparacao(endereco.nomeEndereco),
    normalizarTextoEnderecoParaComparacao(endereco.numero),
    normalizarTextoEnderecoParaComparacao(endereco.complemento),
    normalizarCep(endereco.cep),
    normalizarTextoEnderecoParaComparacao(endereco.cidade),
    normalizarTextoEnderecoParaComparacao(endereco.uf),
  ].join("|");
}

export function normalizarTelefoneParaInput(telefone: string) {
  return formatarTelefone(telefone);
}

export function normalizarDocumentoFiscalParaInput(
  documentoFiscal: string,
  tipoDocumentoFiscal?: number | string,
) {
  if (tipoDocumentoFiscal == null) {
    return formatarCpfOuCnpj(documentoFiscal);
  }

  return formatarDocumentoFiscal(documentoFiscal, tipoDocumentoFiscal);
}

export function normalizarMoedaParaInput(valor: string) {
  return formatarMoedaParaInput(valor);
}

export function enderecoTemConteudo(endereco: PerfilEnderecoFormState | null) {
  if (!endereco) {
    return false;
  }

  return Boolean(
    endereco.tipoLogradouro.trim() ||
      endereco.nomeEndereco.trim() ||
      endereco.numero.trim() ||
      endereco.complemento.trim() ||
      endereco.cep.trim() ||
      endereco.cidade.trim() ||
      endereco.uf.trim(),
  );
}

export function obterErroEnderecoInvalido(endereco: PerfilEnderecoFormState | null) {
  if (!endereco || !enderecoTemConteudo(endereco)) {
    return null;
  }

  if (!endereco.tipoLogradouro.trim()) {
    return "Selecione o tipo de logradouro do novo endereco.";
  }

  if (!endereco.nomeEndereco.trim()) {
    return "Informe o nome do novo endereco.";
  }

  if (!endereco.numero.trim()) {
    return "Informe o numero do novo endereco.";
  }

  if (normalizarCep(endereco.cep).length !== 8) {
    return "Informe um CEP valido com 8 numeros para o novo endereco.";
  }

  if (!endereco.cidade.trim()) {
    return "Informe a cidade do novo endereco.";
  }

  if (endereco.uf.trim().length !== 2) {
    return "Informe uma UF valida com 2 letras para o novo endereco.";
  }

  return null;
}

export function normalizarValorEnderecoFormulario(
  field: keyof PerfilEnderecoFormState,
  value: string,
) {
  if (field === "cep") {
    return formatarCep(value);
  }

  if (field === "uf") {
    return value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
  }

  return value;
}

export function obterMensagemErroLoja(error: unknown) {
  const fallback = "Nao foi possivel salvar a loja.";
  const message = error instanceof Error ? error.message : fallback;

  if (
    message.includes("Cannot insert the value NULL into column 'Slug'") &&
    message.includes("TBL_LOJA")
  ) {
    return "A API da loja no Azure ainda esta com o banco desatualizado: a coluna Slug continua obrigatoria, mas o contrato atual da loja nao envia mais esse campo. Aplique a migration `20260521044322_RemoveSkuSlugProdutosLojas` na API e tente novamente.";
  }

  return message || fallback;
}

export function mapearTelefoneParaFormulario(
  telefone: UsuarioTelefonePerfil,
): PerfilTelefoneFormState {
  return {
    id: telefone.id,
    numero: telefone.numero,
    isPrincipal: telefone.isPrincipal,
  };
}

export function deduplicarTelefonesParaFormulario(
  telefones: PerfilTelefoneFormState[],
  telefoneLojaId?: number | null,
) {
  const telefonesPorNumero = new Map<string, PerfilTelefoneFormState[]>();

  for (const telefone of telefones) {
    const numeroNormalizado =
      normalizarTelefoneParaComparacao(telefone.numero) ||
      `sem-numero-${telefone.id ?? telefone.numero}`;
    const grupoAtual = telefonesPorNumero.get(numeroNormalizado) ?? [];

    grupoAtual.push(telefone);
    telefonesPorNumero.set(numeroNormalizado, grupoAtual);
  }

  const telefonesUnicos: PerfilTelefoneFormState[] = [];
  const telefonesDuplicadosIds: number[] = [];

  for (const grupo of telefonesPorNumero.values()) {
    const telefoneCanonical =
      grupo.find((telefone) => telefone.id === telefoneLojaId) ??
      grupo.find((telefone) => telefone.isPrincipal) ??
      grupo[0];

    telefonesUnicos.push({
      ...telefoneCanonical,
      isPrincipal: grupo.some((telefone) => telefone.isPrincipal),
    });

    grupo.forEach((telefone) => {
      if (telefone.id && telefone.id !== telefoneCanonical.id) {
        telefonesDuplicadosIds.push(telefone.id);
      }
    });
  }

  const estadoNormalizado = normalizarPrincipalTelefones(telefonesUnicos, null);

  return {
    telefones: estadoNormalizado.telefones,
    telefonesDuplicadosIds,
  };
}

export function encontrarTelefoneDuplicado(telefones: PerfilTelefoneFormState[]) {
  const telefonesNormalizados = new Set<string>();

  for (const telefone of telefones) {
    const numeroNormalizado = normalizarTelefoneParaComparacao(telefone.numero);

    if (!numeroNormalizado) {
      continue;
    }

    if (telefonesNormalizados.has(numeroNormalizado)) {
      return true;
    }

    telefonesNormalizados.add(numeroNormalizado);
  }

  return false;
}

export function mapearEnderecoParaFormulario(
  endereco: UsuarioEnderecoPerfil,
): PerfilEnderecoFormState {
  return {
    id: endereco.id,
    tipoLogradouro: endereco.tipoLogradouro,
    nomeEndereco: endereco.nomeEndereco,
    numero: endereco.numero,
    complemento: endereco.complemento ?? "",
    cep: endereco.cep,
    cidade: endereco.cidade,
    uf: endereco.uf,
    isPrincipal: endereco.isPrincipal,
  };
}

export function deduplicarEnderecosParaFormulario(
  enderecos: PerfilEnderecoFormState[],
  enderecoLojaId?: number | null,
) {
  const enderecosPorChave = new Map<string, PerfilEnderecoFormState[]>();

  for (const endereco of enderecos) {
    const chaveComparacao = criarChaveComparacaoEndereco(endereco);
    const grupoAtual = enderecosPorChave.get(chaveComparacao) ?? [];

    grupoAtual.push(endereco);
    enderecosPorChave.set(chaveComparacao, grupoAtual);
  }

  const enderecosUnicos: PerfilEnderecoFormState[] = [];
  const enderecosDuplicadosIds: number[] = [];

  for (const grupo of enderecosPorChave.values()) {
    const enderecoCanonical =
      grupo.find((endereco) => endereco.id === enderecoLojaId) ??
      grupo.find((endereco) => endereco.isPrincipal) ??
      grupo[0];

    enderecosUnicos.push({
      ...enderecoCanonical,
      isPrincipal: grupo.some((endereco) => endereco.isPrincipal),
    });

    grupo.forEach((endereco) => {
      if (endereco.id && endereco.id !== enderecoCanonical.id) {
        enderecosDuplicadosIds.push(endereco.id);
      }
    });
  }

  const estadoNormalizado = normalizarPrincipalEnderecos(enderecosUnicos, null);

  return {
    enderecos: estadoNormalizado.enderecos,
    enderecosDuplicadosIds,
  };
}

export function normalizarPrincipalTelefones(
  telefones: PerfilTelefoneFormState[],
  novoTelefone: PerfilTelefoneFormState | null,
) {
  if (novoTelefone?.isPrincipal) {
    return {
      telefones: telefones.map((telefone) => ({ ...telefone, isPrincipal: false })),
      novoTelefone,
    };
  }

  const principalIndex = telefones.findIndex((telefone) => telefone.isPrincipal);

  if (principalIndex >= 0) {
    return {
      telefones: telefones.map((telefone, index) => ({
        ...telefone,
        isPrincipal: index === principalIndex,
      })),
      novoTelefone: novoTelefone ? { ...novoTelefone, isPrincipal: false } : null,
    };
  }

  if (telefones.length > 0) {
    return {
      telefones: telefones.map((telefone, index) => ({
        ...telefone,
        isPrincipal: index === 0,
      })),
      novoTelefone: novoTelefone ? { ...novoTelefone, isPrincipal: false } : null,
    };
  }

  if (novoTelefone) {
    return {
      telefones,
      novoTelefone: { ...novoTelefone, isPrincipal: true },
    };
  }

  return {
    telefones,
    novoTelefone,
  };
}

export function normalizarPrincipalEnderecos(
  enderecos: PerfilEnderecoFormState[],
  novoEndereco: PerfilEnderecoFormState | null,
) {
  if (novoEndereco?.isPrincipal) {
    return {
      enderecos: enderecos.map((endereco) => ({ ...endereco, isPrincipal: false })),
      novoEndereco,
    };
  }

  const principalIndex = enderecos.findIndex((endereco) => endereco.isPrincipal);

  if (principalIndex >= 0) {
    return {
      enderecos: enderecos.map((endereco, index) => ({
        ...endereco,
        isPrincipal: index === principalIndex,
      })),
      novoEndereco: novoEndereco ? { ...novoEndereco, isPrincipal: false } : null,
    };
  }

  if (enderecos.length > 0) {
    return {
      enderecos: enderecos.map((endereco, index) => ({
        ...endereco,
        isPrincipal: index === 0,
      })),
      novoEndereco: novoEndereco ? { ...novoEndereco, isPrincipal: false } : null,
    };
  }

  if (novoEndereco) {
    return {
      enderecos,
      novoEndereco: { ...novoEndereco, isPrincipal: true },
    };
  }

  return {
    enderecos,
    novoEndereco,
  };
}
