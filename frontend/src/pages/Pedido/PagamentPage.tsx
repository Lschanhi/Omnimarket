import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { PageLayout } from "../../Components/PageLayout";
import { Input } from "../../Components/Input";
import { useCart } from "../../context/CartContext";
import {
  criarEndereco,
  listarEnderecos,
  listarTiposLogradouro,
  removerEndereco,
  TIPOS_LOGRADOURO_FALLBACK,
  type EnderecoApiResponse,
  type TipoLogradouroOption,
} from "../../Services/user/enderecoService";
import {
  confirmarPagamentoFake,
  iniciarPagamento,
} from "../../Services/financeiro/financeiroService";
import { criarPedido } from "../../Services/pedidos/pedidoService";
import { isAuthenticated } from "../../Services/auth/session";
import {
  obterPerfilUsuario,
  type UsuarioPerfilApiResponse,
} from "../../Services/user/usuarioService";
import {
  listarEntregasPublicasLoja,
  type LojaEntregaFiltro,
  type LojaEntregaOpcao,
} from "../../Services/produtos/lojaEntregaService";
import {
  formatarCep,
  formatarNumeroCartao,
  formatarValidadeCartao,
  normalizarCep,
} from "../../utils/masks";

type MetodoPagamento = {
  id: string;
  titulo: string;
  descricao: string;
};

type EnderecoFormState = {
  tipoLogradouro: string;
  nomeEndereco: string;
  numero: string;
  complemento: string;
  cep: string;
  cidade: string;
  uf: string;
  isPrincipal: boolean;
};

type EnderecoExibicao = EnderecoApiResponse & {
  assinatura: string;
  idsAgrupados: number[];
};

type EtapaCheckout = "enderecos" | "entrega" | "pagamento";

type GrupoCarrinhoLoja = {
  lojaId: number;
  lojaNome: string;
  itens: Array<{
    produtoId: number;
    nome: string;
    quantidade: number;
    subtotal: number;
  }>;
  subtotal: number;
};

type ResumoCheckoutLoja = {
  lojaId: number;
  lojaNome: string;
  quantidadeItens: number;
  subtotal: number;
  frete: number;
  total: number;
  descricaoEntrega: string;
  erroEntrega: string;
};

type PagamentoCartaoFormState = {
  numeroCartao: string;
  validadeCartao: string;
  nomeCartao: string;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const METODOS_PAGAMENTO: MetodoPagamento[] = [
  {
    id: "pix",
    titulo: "PIX",
    descricao: "Confirmação rápida após a finalização da compra.",
  },
  {
    id: "credito",
    titulo: "Cartão de crédito",
    descricao: "Ideal para parcelamento e pagamentos online.",
  },
  {
    id: "debito",
    titulo: "Cartao de débito",
    descricao: "Débito imediato com validação simples.",
  },
  {
    id: "boleto",
    titulo: "Boleto bancário",
    descricao: "Ainda não disponivel na API atual.",
  },
];

const ENDERECO_FORM_PADRAO: EnderecoFormState = {
  tipoLogradouro: "Rua",
  nomeEndereco: "",
  numero: "",
  complemento: "",
  cep: "",
  cidade: "",
  uf: "",
  isPrincipal: false,
};

const PAGAMENTO_CARTAO_FORM_PADRAO: PagamentoCartaoFormState = {
  numeroCartao: "",
  validadeCartao: "",
  nomeCartao: "",
};

function criarEnderecoFormInicial(tipoLogradouroPadrao = "Rua", isPrincipal = false) {
  return {
    ...ENDERECO_FORM_PADRAO,
    tipoLogradouro: tipoLogradouroPadrao,
    isPrincipal,
  };
}

function enderecoTemConteudo(endereco: EnderecoFormState) {
  return Boolean(
    endereco.nomeEndereco.trim() ||
      endereco.numero.trim() ||
      endereco.complemento.trim() ||
      endereco.cep.trim() ||
      endereco.cidade.trim() ||
      endereco.uf.trim(),
  );
}

function enderecoEstaCompleto(endereco: EnderecoFormState) {
  return Boolean(
    endereco.tipoLogradouro.trim() &&
      endereco.nomeEndereco.trim() &&
      endereco.numero.trim() &&
      normalizarCep(endereco.cep).length === 8 &&
      endereco.cidade.trim() &&
      endereco.uf.trim().length === 2,
  );
}

function mapearEnderecoPerfilParaDetalhe(
  endereco: UsuarioPerfilApiResponse["enderecos"][number],
): EnderecoApiResponse {
  return {
    id: endereco.id,
    tipoLogradouro: endereco.tipoLogradouro,
    nomeEndereco: endereco.nomeEndereco,
    numero: endereco.numero,
    complemento: "",
    cep: endereco.cep,
    cidade: endereco.cidade,
    uf: endereco.uf,
    isPrincipal: endereco.isPrincipal,
    ativo: endereco.ativo,
  };
}

function normalizarTextoEndereco(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function criarAssinaturaEndereco(endereco: EnderecoApiResponse) {
  return [
    normalizarTextoEndereco(endereco.tipoLogradouro),
    normalizarTextoEndereco(endereco.nomeEndereco),
    normalizarTextoEndereco(endereco.numero),
    normalizarTextoEndereco(endereco.complemento),
    normalizarTextoEndereco(endereco.cep),
    normalizarTextoEndereco(endereco.cidade),
    normalizarTextoEndereco(endereco.uf),
  ].join("|");
}

function agruparEnderecos(enderecos: EnderecoApiResponse[]) {
  const agrupados = new Map<string, EnderecoExibicao>();

  for (const endereco of enderecos) {
    const assinatura = criarAssinaturaEndereco(endereco);
    const existente = agrupados.get(assinatura);

    if (!existente) {
      agrupados.set(assinatura, {
        ...endereco,
        assinatura,
        idsAgrupados: [endereco.id],
      });
      continue;
    }

    existente.idsAgrupados.push(endereco.id);
    existente.isPrincipal = existente.isPrincipal || endereco.isPrincipal;
    existente.ativo = existente.ativo || endereco.ativo;

    if ((!existente.complemento || !existente.complemento.trim()) && endereco.complemento?.trim()) {
      existente.complemento = endereco.complemento;
    }

    if (endereco.isPrincipal) {
      existente.id = endereco.id;
    }
  }

  return Array.from(agrupados.values());
}

function obterEnderecoPrincipal<T extends { isPrincipal: boolean }>(enderecos: T[]) {
  return enderecos.find((endereco) => endereco.isPrincipal) ?? enderecos[0] ?? null;
}

function formatarResumoEndereco(endereco: EnderecoExibicao) {
  return `${endereco.tipoLogradouro} ${endereco.nomeEndereco}, ${endereco.numero}`;
}

function formatarDetalheEndereco(endereco: EnderecoExibicao) {
  const partes = [`${endereco.cidade}, ${endereco.uf}`];

  if (endereco.complemento?.trim()) {
    partes.unshift(endereco.complemento.trim());
  }

  const cep = formatarCep(endereco.cep);

  if (cep.trim()) {
    partes.push(cep);
  }

  if (endereco.isPrincipal) {
    partes.push("Principal");
  }

  return partes.join(" - ");
}

function limparTextoOpcional(value: string | null | undefined) {
  const texto = (value ?? "").trim();
  return texto || undefined;
}

function criarFiltroEntrega(
  enderecoSelecionado: EnderecoExibicao | null,
  mostrarNovoEnderecoForm: boolean,
  enderecoForm: EnderecoFormState,
): LojaEntregaFiltro {
  if (mostrarNovoEnderecoForm && enderecoTemConteudo(enderecoForm)) {
    return {
      cep: limparTextoOpcional(normalizarCep(enderecoForm.cep)),
      cidade: limparTextoOpcional(enderecoForm.cidade),
      uf: limparTextoOpcional(enderecoForm.uf)?.toUpperCase(),
    };
  }

  if (!enderecoSelecionado) {
    return {};
  }

  return {
    cep: limparTextoOpcional(normalizarCep(enderecoSelecionado.cep)),
    cidade: limparTextoOpcional(enderecoSelecionado.cidade),
    uf: limparTextoOpcional(enderecoSelecionado.uf)?.toUpperCase(),
  };
}

function formatarMoeda(valor: number) {
  return currencyFormatter.format(valor);
}

function formatarPrazoEntrega(prazoEntregaDias: number) {
  if (prazoEntregaDias <= 0) {
    return "Disponivél imediatamente";
  }

  if (prazoEntregaDias === 1) {
    return "Receba em até 1 dia útil";
  }

  return `Receba em até ${prazoEntregaDias} dias úteis`;
}

function formatarDescricaoEntregaLoja(opcaoEntrega: LojaEntregaOpcao | null) {
  if (!opcaoEntrega) {
    return "Selecione uma opção de entrega";
  }

  return `${opcaoEntrega.nome} - ${formatarPrazoEntrega(opcaoEntrega.prazoEntregaDias)}`;
}

function criarImagemResumoPlaceholder(label: string) {
  const titulo = label.trim().slice(0, 20) || "OmniMarket";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#111827" />
        </linearGradient>
      </defs>
      <rect width="320" height="320" rx="32" fill="url(#bg)" />
      <circle cx="250" cy="78" r="54" fill="rgba(255,255,255,0.12)" />
      <circle cx="84" cy="236" r="72" fill="rgba(0,0,0,0.16)" />
      <text x="28" y="166" fill="#ffffff" font-family="Arial, sans-serif" font-size="24" font-weight="700">
        ${titulo}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function agruparCarrinhoPorLoja(
  carrinhoItens: Array<{
    produtoId: number;
    nome: string;
    quantidade: number;
    subtotal: number;
    lojaId?: number;
    lojaNome?: string;
  }>,
) {
  const grupos = new Map<number, GrupoCarrinhoLoja>();

  for (const item of carrinhoItens) {
    const lojaId = item.lojaId ?? 0;

    if (!grupos.has(lojaId)) {
      grupos.set(lojaId, {
        lojaId,
        lojaNome: item.lojaNome?.trim() || `Loja ${lojaId || "indefinida"}`,
        itens: [],
        subtotal: 0,
      });
    }

    const grupo = grupos.get(lojaId);

    if (!grupo) {
      continue;
    }

    grupo.itens.push({
      produtoId: item.produtoId,
      nome: item.nome,
      quantidade: item.quantidade,
      subtotal: item.subtotal,
    });
    grupo.subtotal += item.subtotal;
  }

  return Array.from(grupos.values());
}

export function PagamentPage() {
  const [metodo, setMetodo] = useState("pix");
  const [etapaAberta, setEtapaAberta] = useState<EtapaCheckout | null>("enderecos");
  const [fretesSelecionadosPorLoja, setFretesSelecionadosPorLoja] = useState<
    Record<number, number | null>
  >({});
  const [enderecoForm, setEnderecoForm] = useState<EnderecoFormState>(
    criarEnderecoFormInicial(),
  );
  const [perfil, setPerfil] = useState<UsuarioPerfilApiResponse | null>(null);
  const [enderecosSalvos, setEnderecosSalvos] = useState<EnderecoApiResponse[]>([]);
  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState<number | null>(null);
  const [mostrarNovoEnderecoForm, setMostrarNovoEnderecoForm] = useState(false);
  const [tiposLogradouro, setTiposLogradouro] = useState<TipoLogradouroOption[]>(
    TIPOS_LOGRADOURO_FALLBACK,
  );
  const [opcoesEntregaPorLoja, setOpcoesEntregaPorLoja] = useState<
    Record<number, LojaEntregaOpcao[]>
  >({});
  const [isLoadingEntregas, setIsLoadingEntregas] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [errosEntregaPorLoja, setErrosEntregaPorLoja] = useState<Record<number, string>>({});
  const [isRemovingAddress, setIsRemovingAddress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erro, setErro] = useState("");
  const [pagamentoCartaoForm, setPagamentoCartaoForm] = useState<PagamentoCartaoFormState>(
    PAGAMENTO_CARTAO_FORM_PADRAO,
  );
  const { carrinhoItens, valorTotal, clearCart, carregarCarrinho, estaAutenticado } = useCart();
  const navigate = useNavigate();

  const subtotal = valorTotal;
  const enderecosExibidos = agruparEnderecos(enderecosSalvos);
  const temEnderecoSalvo = enderecosExibidos.length > 0;
  const enderecoSelecionado =
    enderecosExibidos.find((endereco) => endereco.id === enderecoSelecionadoId) ??
    obterEnderecoPrincipal(enderecosExibidos);
  const tipoLogradouroPadrao =
    tiposLogradouro[0]?.codigo ?? ENDERECO_FORM_PADRAO.tipoLogradouro;
  const gruposCarrinho = useMemo(() => agruparCarrinhoPorLoja(carrinhoItens), [carrinhoItens]);
  const gruposCarrinhoValidos = useMemo(
    () => gruposCarrinho.filter((grupo) => grupo.lojaId > 0),
    [gruposCarrinho],
  );
  const carrinhoTemLojasInvalidas = gruposCarrinhoValidos.length !== gruposCarrinho.length;
  const gruposCarrinhoValidosKey = useMemo(
    () =>
      gruposCarrinhoValidos
        .map(
          (grupo) =>
            `${grupo.lojaId}:${grupo.itens
              .map((item) => `${item.produtoId}-${item.quantidade}`)
              .join(",")}`,
        )
        .join("|"),
    [gruposCarrinhoValidos],
  );
  const filtroEntrega = criarFiltroEntrega(
    enderecoSelecionado,
    mostrarNovoEnderecoForm,
    enderecoForm,
  );
  const filtroEntregaCep = filtroEntrega.cep ?? "";
  const filtroEntregaCidade = filtroEntrega.cidade ?? "";
  const filtroEntregaUf = filtroEntrega.uf ?? "";
  const valorFreteSelecionado = gruposCarrinhoValidos.reduce((accumulator, grupo) => {
    const opcoes = opcoesEntregaPorLoja[grupo.lojaId] ?? [];
    const opcaoSelecionada =
      opcoes.find((opcao) => opcao.id === fretesSelecionadosPorLoja[grupo.lojaId]) ?? null;

    return accumulator + (opcaoSelecionada?.valorFrete ?? 0);
  }, 0);
  const checkoutTemEntregasValidas =
    gruposCarrinhoValidos.length > 0 &&
    !carrinhoTemLojasInvalidas &&
    gruposCarrinhoValidos.every((grupo) => {
      const opcoes = opcoesEntregaPorLoja[grupo.lojaId] ?? [];
      const erroEntrega = errosEntregaPorLoja[grupo.lojaId];
      const opcaoSelecionada =
        opcoes.find((opcao) => opcao.id === fretesSelecionadosPorLoja[grupo.lojaId]) ?? null;

      return Boolean(!erroEntrega && opcaoSelecionada?.tipoEntregaId);
    });
  const resumoCheckoutPorLoja = useMemo<ResumoCheckoutLoja[]>(
    () =>
      gruposCarrinhoValidos.map((grupo) => {
        const opcoes = opcoesEntregaPorLoja[grupo.lojaId] ?? [];
        const opcaoSelecionada =
          opcoes.find((opcao) => opcao.id === fretesSelecionadosPorLoja[grupo.lojaId]) ?? null;
        const erroEntrega = errosEntregaPorLoja[grupo.lojaId] ?? "";
        const frete = opcaoSelecionada?.valorFrete ?? 0;

        return {
          lojaId: grupo.lojaId,
          lojaNome: grupo.lojaNome,
          quantidadeItens: grupo.itens.reduce(
            (accumulator, item) => accumulator + item.quantidade,
            0,
          ),
          subtotal: grupo.subtotal,
          frete,
          total: grupo.subtotal + frete,
          descricaoEntrega: formatarDescricaoEntregaLoja(opcaoSelecionada),
          erroEntrega,
        };
      }),
    [errosEntregaPorLoja, fretesSelecionadosPorLoja, gruposCarrinhoValidos, opcoesEntregaPorLoja],
  );
  const total = subtotal + valorFreteSelecionado;

  function alternarEtapa(etapa: EtapaCheckout) {
    setEtapaAberta((currentEtapa) => (currentEtapa === etapa ? null : etapa));
  }

  useEffect(() => {
    let isMounted = true;

    if (!estaAutenticado) {
      setPerfil(null);
      setEnderecosSalvos([]);
      setEnderecoSelecionadoId(null);
      setMostrarNovoEnderecoForm(false);
      setEnderecoForm(criarEnderecoFormInicial(ENDERECO_FORM_PADRAO.tipoLogradouro));
      return () => {
        isMounted = false;
      };
    }

    async function carregarPerfil() {
      try {
        setErro("");

        const response = await obterPerfilUsuario();
        const [enderecosDetalhados, tiposResponse] = await Promise.all([
          listarEnderecos(response.id).catch(() => []),
          listarTiposLogradouro(response.id).catch(() => TIPOS_LOGRADOURO_FALLBACK),
        ]);

        if (!isMounted) {
          return;
        }

        const tiposDisponiveis =
          tiposResponse.length > 0 ? tiposResponse : TIPOS_LOGRADOURO_FALLBACK;
        const enderecosCarregadosBrutos =
          enderecosDetalhados.length > 0
            ? enderecosDetalhados.filter((endereco) => endereco.ativo)
            : response.enderecos
                .map(mapearEnderecoPerfilParaDetalhe)
                .filter((endereco) => endereco.ativo);
        const enderecosCarregados = agruparEnderecos(enderecosCarregadosBrutos);
        const enderecoPrincipal = obterEnderecoPrincipal(enderecosCarregados);

        setPerfil(response);
        setTiposLogradouro(tiposDisponiveis);
        setEnderecosSalvos(enderecosCarregadosBrutos);
        setEnderecoSelecionadoId(enderecoPrincipal?.id ?? null);
        setMostrarNovoEnderecoForm(enderecosCarregadosBrutos.length === 0);
        setEnderecoForm(
          criarEnderecoFormInicial(
            tiposDisponiveis[0]?.codigo ?? ENDERECO_FORM_PADRAO.tipoLogradouro,
            enderecosCarregadosBrutos.length === 0,
          ),
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os dados do usuário.";
        setErro(message);
      }
    }

    void carregarPerfil();

    return () => {
      isMounted = false;
    };
  }, [estaAutenticado]);

  useEffect(() => {
    let isMounted = true;

    if (carrinhoItens.length === 0) {
      setOpcoesEntregaPorLoja({});
      setFretesSelecionadosPorLoja({});
      setErrosEntregaPorLoja({});
      setIsLoadingEntregas(false);
      return () => {
        isMounted = false;
      };
    }

    if (carrinhoTemLojasInvalidas) {
      setOpcoesEntregaPorLoja({});
      setFretesSelecionadosPorLoja({});
      setErrosEntregaPorLoja({
        0: "Não foi possível identificar a loja de um ou mais itens do carrinho.",
      });
      setIsLoadingEntregas(false);
      return () => {
        isMounted = false;
      };
    }

    async function carregarEntregas() {
      try {
        setIsLoadingEntregas(true);
        setErrosEntregaPorLoja({});

        const respostas = await Promise.all(
          gruposCarrinhoValidos.map(async (grupo) => {
            try {
              const opcoes = await listarEntregasPublicasLoja(grupo.lojaId, {
                cep: filtroEntregaCep || undefined,
                cidade: filtroEntregaCidade || undefined,
                uf: filtroEntregaUf || undefined,
              });

              return {
                lojaId: grupo.lojaId,
                opcoes,
                erro: "",
              };
            } catch (error) {
              return {
                lojaId: grupo.lojaId,
                opcoes: [],
                erro:
                  error instanceof Error
                    ? error.message
                    : "Não foi possível carregar as opções de entrega da loja.",
              };
            }
          }),
        );

        if (!isMounted) {
          return;
        }

        const proximasOpcoes: Record<number, LojaEntregaOpcao[]> = {};
        const proximosErros: Record<number, string> = {};

        for (const resposta of respostas) {
          proximasOpcoes[resposta.lojaId] = resposta.opcoes;

          if (resposta.erro) {
            proximosErros[resposta.lojaId] = resposta.erro;
            continue;
          }

          if (resposta.opcoes.length === 0) {
            proximosErros[resposta.lojaId] =
              "Está loja ainda não configurou opções de entrega para o checkout.";
            continue;
          }

          if (!resposta.opcoes.some((opcao) => opcao.tipoEntregaId)) {
            proximosErros[resposta.lojaId] =
              "As opções de entrega desta loja ainda não possuem um tipo compativel com o checkout atual.";
          }
        }

        setOpcoesEntregaPorLoja(proximasOpcoes);
        setErrosEntregaPorLoja(proximosErros);
        setFretesSelecionadosPorLoja((currentState) => {
          const proximoState: Record<number, number | null> = {};

          for (const resposta of respostas) {
            const selecionadoAtual = currentState[resposta.lojaId];

            if (
              selecionadoAtual &&
              resposta.opcoes.some((opcao) => opcao.id === selecionadoAtual)
            ) {
              proximoState[resposta.lojaId] = selecionadoAtual;
              continue;
            }

            proximoState[resposta.lojaId] =
              resposta.opcoes.find((opcao) => opcao.tipoEntregaId)?.id ??
              resposta.opcoes[0]?.id ??
              null;
          }

          return proximoState;
        });
      } finally {
        if (isMounted) {
          setIsLoadingEntregas(false);
        }
      }
    }

    void carregarEntregas();

    return () => {
      isMounted = false;
    };
  }, [
    carrinhoItens.length,
    gruposCarrinhoValidos,
    gruposCarrinhoValidosKey,
    carrinhoTemLojasInvalidas,
    filtroEntregaCep,
    filtroEntregaCidade,
    filtroEntregaUf,
  ]);

  function handleEnderecoChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;

    setEnderecoForm((currentForm) => ({
      ...currentForm,
      [name]:
        name === "cep"
          ? formatarCep(value)
          : name === "uf"
            ? value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase()
            : value,
    }));
    setErro("");
  }

  function handlePagamentoCartaoChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setPagamentoCartaoForm((currentForm) => ({
      ...currentForm,
      [name]:
        name === "numeroCartao"
          ? formatarNumeroCartao(value)
          : name === "validadeCartao"
            ? formatarValidadeCartao(value)
            : value,
    }));
    setErro("");
  }

  function handleNovoEnderecoPrincipalChange(event: ChangeEvent<HTMLInputElement>) {
    const { checked } = event.target;

    setEnderecoForm((currentForm) => ({
      ...currentForm,
      isPrincipal: checked,
    }));
    setErro("");
  }

  function handleAdicionarEndereco() {
    setEtapaAberta("enderecos");
    setMostrarNovoEnderecoForm(true);
    setEnderecoForm(criarEnderecoFormInicial(tipoLogradouroPadrao, !temEnderecoSalvo));
    setErro("");
  }

  function handleCancelarNovoEndereco() {
    setMostrarNovoEnderecoForm(false);
    setEnderecoForm(criarEnderecoFormInicial(tipoLogradouroPadrao));
    setErro("");
  }

  function handleSelecionarEndereco(enderecoId: number) {
    setEnderecoSelecionadoId(enderecoId);
    setErro("");
  }

  function handleSelecionarFreteLoja(lojaId: number, entregaId: number) {
    setFretesSelecionadosPorLoja((currentState) => ({
      ...currentState,
      [lojaId]: entregaId,
    }));
    setErro("");
  }

  async function handleRemoverEndereco(endereco: EnderecoExibicao) {
    if (!perfil || isRemovingAddress || isSubmitting) {
      return;
    }

    try {
      setIsRemovingAddress(endereco.id);
      setErro("");

      await Promise.all(
        endereco.idsAgrupados.map((enderecoId) => removerEndereco(perfil.id, enderecoId)),
      );

      const proximaLista = enderecosSalvos.filter(
        (item) => !endereco.idsAgrupados.includes(item.id),
      );
      const proximosEnderecosExibidos = agruparEnderecos(proximaLista);
      const proximoSelecionado =
        enderecoSelecionadoId && endereco.idsAgrupados.includes(enderecoSelecionadoId)
          ? obterEnderecoPrincipal(proximosEnderecosExibidos)?.id ?? null
          : enderecoSelecionadoId;

      setEnderecosSalvos(proximaLista);
      setEnderecoSelecionadoId(proximoSelecionado);
      setPerfil((currentProfile) =>
        currentProfile
          ? {
              ...currentProfile,
              enderecos: currentProfile.enderecos.filter(
                (item) => !endereco.idsAgrupados.includes(item.id),
              ),
            }
          : currentProfile,
      );

      if (proximosEnderecosExibidos.length === 0) {
        setMostrarNovoEnderecoForm(true);
        setEnderecoForm(criarEnderecoFormInicial(tipoLogradouroPadrao, true));
      }
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível remover o endereço.",
      );
    } finally {
      setIsRemovingAddress(null);
    }
  }

  function mapearFormaPagamentoId() {
    switch (metodo) {
      case "pix":
        return 1;
      case "debito":
        return 3;
      case "credito":
        return 4;
      default:
        return null;
    }
  }

  async function resolverEnderecoId() {
    const perfilAtual = perfil ?? (await obterPerfilUsuario());
    const enderecosDisponiveis =
      enderecosSalvos.length > 0
        ? enderecosSalvos
        : perfilAtual.enderecos
            .map(mapearEnderecoPerfilParaDetalhe)
            .filter((endereco) => endereco.ativo);
    const enderecoExistenteId =
      enderecoSelecionadoId ?? obterEnderecoPrincipal(enderecosDisponiveis)?.id;

    if (!mostrarNovoEnderecoForm) {
      return enderecoExistenteId;
    }

    if (!enderecoTemConteudo(enderecoForm)) {
      return enderecoExistenteId;
    }

    if (!enderecoEstaCompleto(enderecoForm)) {
      throw new Error(
        "Preencha o tipo de logradouro, nome do endereço, CEP, cidade, número e UF para usar um novo endereço.",
      );
    }

    const enderecoCriado = await criarEndereco(perfilAtual.id, {
      cep: normalizarCep(enderecoForm.cep),
      tipoLogradouro: enderecoForm.tipoLogradouro.trim(),
      nomeEndereco: enderecoForm.nomeEndereco.trim(),
      numero: enderecoForm.numero.trim(),
      complemento: enderecoForm.complemento.trim() || undefined,
      cidade: enderecoForm.cidade.trim(),
      uf: enderecoForm.uf.trim().toUpperCase(),
      isPrincipal: enderecoForm.isPrincipal,
    });

    const enderecosAtualizados = enderecoCriado.isPrincipal
      ? enderecosDisponiveis.map((endereco) => ({ ...endereco, isPrincipal: false }))
      : enderecosDisponiveis;
    const proximaLista = [...enderecosAtualizados, enderecoCriado];

    setEnderecosSalvos(proximaLista);
    setEnderecoSelecionadoId(enderecoCriado.id);
    setMostrarNovoEnderecoForm(false);
    setEnderecoForm(criarEnderecoFormInicial(tipoLogradouroPadrao));
    setPerfil((currentProfile) =>
      currentProfile
        ? {
            ...currentProfile,
            enderecos: [
              ...(enderecoCriado.isPrincipal
                ? currentProfile.enderecos.map((endereco) => ({
                    ...endereco,
                    isPrincipal: false,
                  }))
                : currentProfile.enderecos),
              {
                id: enderecoCriado.id,
                tipoLogradouro: enderecoCriado.tipoLogradouro,
                nomeEndereco: enderecoCriado.nomeEndereco,
                numero: enderecoCriado.numero,
                cep: enderecoCriado.cep,
                cidade: enderecoCriado.cidade,
                uf: enderecoCriado.uf,
                isPrincipal: enderecoCriado.isPrincipal,
                ativo: enderecoCriado.ativo,
              },
            ],
          }
        : currentProfile,
    );

    return enderecoCriado.id;
  }

  async function handleSalvarNovoEndereco() {
    if (isSavingAddress || isSubmitting) {
      return;
    }

    try {
      setIsSavingAddress(true);
      setErro("");

      const enderecoId = await resolverEnderecoId();

      if (!enderecoId) {
        throw new Error("Preencha os dados do endereco para salvar.");
      }

      setEtapaAberta("entrega");
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Nao foi possivel salvar o endereco.",
      );
    } finally {
      setIsSavingAddress(false);
    }
  }

  async function handleFinalizarCompra() {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
      return;
    }

    if (carrinhoItens.length === 0) {
      setErro("Seu carrinho está vazio.");
      return;
    }

    if (carrinhoTemLojasInvalidas) {
      setErro("Não foi possível identificar a loja de um ou mais itens do carrinho.");
      return;
    }

    if (!checkoutTemEntregasValidas) {
      setErro("Selecione uma opção de entrega válida para cada loja antes de finalizar a compra.");
      return;
    }

    const formaPagamentoId = mapearFormaPagamentoId();

    if (!formaPagamentoId) {
      setErro("O método de pagamento selecionado ainda não esta disponivel na API.");
      return;
    }

    setIsSubmitting(true);
    setErro("");

    const pedidosProcessados: Array<{
      pedidoId: number;
      lojaNome: string;
      total: number;
      statusPagamento: string;
      itens: Array<{
        produtoId: number;
        nome: string;
        quantidade: number;
        subtotal: number;
      }>;
    }> = [];

    try {
      const enderecoId = await resolverEnderecoId();

      if (!enderecoId) {
        throw new Error("Cadastre ou selecione um endereço de entrega antes de continuar.");
      }

      for (const grupo of gruposCarrinhoValidos) {
        const opcoesLoja = opcoesEntregaPorLoja[grupo.lojaId] ?? [];
        const opcaoEntregaSelecionada =
          opcoesLoja.find((opcao) => opcao.id === fretesSelecionadosPorLoja[grupo.lojaId]) ?? null;

        if (!opcaoEntregaSelecionada?.tipoEntregaId) {
          throw new Error(
            `Selecione uma opção de entrega válida para a loja ${grupo.lojaNome} antes de finalizar a compra.`,
          );
        }

        const pedido = await criarPedido({
          enderecoId,
          tipoEntregaId: opcaoEntregaSelecionada.tipoEntregaId,
          observacao: "",
          itens: grupo.itens.map((item) => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
          })),
        });

        const valorFreteFinal =
          Number(pedido.valorFrete) > 0
            ? Number(pedido.valorFrete)
            : opcaoEntregaSelecionada.valorFrete;
        const totalFinal = Number(pedido.valorProdutos) + valorFreteFinal;

        const pagamento = await iniciarPagamento({
          pedidoId: pedido.pedidoId,
          formaPagamentoId,
          observacao: `Checkout web via ${metodo}`,
        });

        const confirmacao = await confirmarPagamentoFake(pagamento.planoPagamentoId);

        pedidosProcessados.push({
          pedidoId: pedido.pedidoId,
          lojaNome: grupo.lojaNome,
          total: totalFinal,
          statusPagamento: confirmacao.statusPagamento,
          itens: grupo.itens,
        });
      }

      await clearCart();

      const totalFinalCheckout = pedidosProcessados.reduce(
        (accumulator, pedidoAtual) => accumulator + pedidoAtual.total,
        0,
      );
      const statusPagamentoFinal =
        pedidosProcessados.every(
          (pedidoAtual) => pedidoAtual.statusPagamento === pedidosProcessados[0]?.statusPagamento,
        )
          ? pedidosProcessados[0]?.statusPagamento ?? "Confirmado"
          : "Confirmado parcialmente";
      const todosItens = pedidosProcessados.flatMap((pedidoAtual) => pedidoAtual.itens);

      navigate({
        to: "/paginaSucesso",
        state: (currentState) => ({
          ...currentState,
          checkoutResult: {
            pedidoId: pedidosProcessados[0]?.pedidoId ?? 0,
            pedidoIds: pedidosProcessados.map((pedidoAtual) => pedidoAtual.pedidoId),
            pedidos: pedidosProcessados,
            total: totalFinalCheckout,
            metodoPagamento:
              METODOS_PAGAMENTO.find((item) => item.id === metodo)?.titulo ?? metodo,
            statusPagamento: statusPagamentoFinal,
            itens: todosItens.map((item) => ({
              produtoId: item.produtoId,
              nome: item.nome,
              quantidade: item.quantidade,
              subtotal: item.subtotal,
            })),
          },
        }),
      });
    } catch (error) {
      if (pedidosProcessados.length > 0) {
        await carregarCarrinho().catch(() => undefined);
      }

      const message =
        error instanceof Error ? error.message : "Não foi possível finalizar a compra.";
      setErro(
        pedidosProcessados.length > 0
          ? `Parte da compra ja foi processada para outras lojas. ${message}`
          : message,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-6">
              <div className="mb-6 border-b border-white/10 pb-5">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-yellow-400/80">
                  Resumo do pedido
                </span>
                <h2 className="mt-2 text-2xl font-semibold text-white">Produtos selecionados</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Confira os itens da compra antes de seguir para endereço, entrega e pagamento.
                </p>
              </div>

              <div className="space-y-5">
                {gruposCarrinho.map((grupo) => (
                  <div
                    key={`${grupo.lojaId}-${grupo.lojaNome}`}
                    className="rounded-2xl border border-white/10 bg-black/15 p-4"
                  >
                    <div className="mb-4 flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{grupo.lojaNome}</h3>
                        <p className="mt-1 text-sm text-zinc-400">
                          {grupo.itens.reduce(
                            (accumulator, item) => accumulator + item.quantidade,
                            0,
                          )}{" "}
                          item(ns) nesta loja
                        </p>
                      </div>

                      <span className="text-sm font-semibold text-yellow-400">
                        Subtotal da loja: {formatarMoeda(grupo.subtotal)}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {carrinhoItens
                        .filter((item) => (item.lojaId ?? 0) === grupo.lojaId)
                        .map((item) => (
                          <article
                            key={`${grupo.lojaId}-${item.produtoId}`}
                            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4"
                          >
                            <img
                              src={item.imagem ?? criarImagemResumoPlaceholder(item.nome)}
                              alt={item.nome}
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = criarImagemResumoPlaceholder(item.nome);
                              }}
                              className="h-20 w-20 shrink-0 rounded-2xl border border-white/10 bg-black/30 object-cover"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-lg font-semibold text-white">
                                {item.nome}
                              </p>
                              <p className="mt-1 text-sm text-zinc-400">
                                Valor unitário: {formatarMoeda(item.preco)}
                              </p>
                              <p className="mt-1 text-sm text-zinc-400">
                                Quantidade: {item.quantidade}
                              </p>
                              <p className="mt-2 text-sm font-semibold text-yellow-400">
                                Valor total: {formatarMoeda(item.subtotal)}
                              </p>
                            </div>
                          </article>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-6">
              <div className="mb-6 flex gap-4 border-b border-white/10 pb-5">
                <button
                  type="button"
                  onClick={() => alternarEtapa("enderecos")}
                  className="flex flex-1 items-start justify-between gap-4 text-left"
                  aria-expanded={etapaAberta === "enderecos"}
                >
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-yellow-400/80">
                      Etapa 1
                    </span>
                    <h2 className="text-2xl font-semibold text-white">Enderecos</h2>
                    <p className="max-w-2xl text-sm leading-6 text-zinc-400">
                      Revise os endereços atuais e use o `+` para abrir mais um cadastro.
                    </p>
                  </div>

                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-zinc-300 transition hover:border-yellow-400/40 hover:text-yellow-300">
                    {etapaAberta === "enderecos" ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleAdicionarEndereco}
                  disabled={mostrarNovoEnderecoForm}
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
                    mostrarNovoEnderecoForm
                      ? "cursor-not-allowed border-white/10 bg-white/5 text-neutral-600"
                      : "border-yellow-400/30 bg-yellow-400/10 text-yellow-300 hover:border-yellow-400/50 hover:bg-yellow-400/20"
                  }`}
                  aria-label="Adicionar endereco"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {etapaAberta === "enderecos" ? (
                <div className="space-y-4">
                  {temEnderecoSalvo ? (
                    enderecosExibidos.map((endereco) => {
                      const selecionado = enderecoSelecionado?.id === endereco.id;

                      return (
                        <div
                          key={endereco.id}
                          className={`flex items-start gap-4 rounded-2xl border p-4 transition duration-200 hover:border-yellow-400/60 hover:bg-black/30 ${
                            selecionado
                              ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_0_1px_rgba(250,204,21,0.20)]"
                              : "border-white/10 bg-black/20"
                          }`}
                        >
                          <label
                            htmlFor={`endereco-salvo-${endereco.id}`}
                            className="flex min-w-0 flex-1 cursor-pointer items-start gap-4"
                          >
                            <input
                              id={`endereco-salvo-${endereco.id}`}
                              type="radio"
                              name="endereco-salvo"
                              checked={selecionado}
                              onChange={() => handleSelecionarEndereco(endereco.id)}
                              className="mt-1 h-4 w-4 border-white/20 bg-transparent text-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-white">
                                {formatarResumoEndereco(endereco)}
                              </p>
                              <p className="mt-1 text-sm text-zinc-400">
                                {formatarDetalheEndereco(endereco)}
                              </p>
                            </div>
                          </label>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleRemoverEndereco(endereco);
                            }}
                            disabled={isRemovingAddress === endereco.id}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10 text-red-300 transition hover:border-red-400/40 hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Remover endereco"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-yellow-400/20 bg-yellow-400/5 px-4 py-5 text-sm text-zinc-300">
                      Nenhum endereço ativo foi encontrado no seu perfil. Cadastre o primeiro para
                      concluir a compra.
                    </div>
                  )}

                  {mostrarNovoEnderecoForm ? (
                    <div className="rounded-2xl border border-dashed border-yellow-400/25 bg-yellow-400/5 p-4">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-white">
                          <Plus className="h-4 w-4 text-yellow-400" />
                          <span>{temEnderecoSalvo ? "Novo endereco" : "Primeiro endereco"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-200">
                            <input
                              type="checkbox"
                              checked={enderecoForm.isPrincipal}
                              onChange={handleNovoEnderecoPrincipalChange}
                              className="h-3.5 w-3.5 cursor-pointer accent-yellow-500"
                            />
                            Principal
                          </label>

                          {temEnderecoSalvo ? (
                            <button
                              type="button"
                              onClick={handleCancelarNovoEndereco}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-neutral-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                            >
                              Cancelar
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="tipoLogradouro" className="text-[#6b6b6b]">
                            Tipo de logradouro
                          </label>
                          <select
                            id="tipoLogradouro"
                            name="tipoLogradouro"
                            value={enderecoForm.tipoLogradouro}
                            onChange={handleEnderecoChange}
                            className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none transition focus:border-yellow-400"
                          >
                            {tiposLogradouro.map((tipo) => (
                              <option key={tipo.codigo} value={tipo.codigo}>
                                {tipo.descricao}
                              </option>
                            ))}
                          </select>
                        </div>

                        <Input
                          id="nomeEndereco"
                          name="nomeEndereco"
                          label="Nome do endereço"
                          value={enderecoForm.nomeEndereco}
                          onChange={handleEnderecoChange}
                          className="h-12 rounded-2xl border-white/10 bg-black/40 px-4 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                        />
                        <Input
                          id="numero"
                          name="numero"
                          label="Número"
                          inputMode="numeric"
                          value={enderecoForm.numero}
                          onChange={handleEnderecoChange}
                          className="h-12 rounded-2xl border-white/10 bg-black/40 px-4 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                        />
                        <Input
                          id="complemento"
                          name="complemento"
                          label="Complemento"
                          value={enderecoForm.complemento}
                          onChange={handleEnderecoChange}
                          className="h-12 rounded-2xl border-white/10 bg-black/40 px-4 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                        />
                        <Input
                          id="cep"
                          name="cep"
                          label="CEP"
                          inputMode="numeric"
                          maxLength={9}
                          autoComplete="postal-code"
                          value={enderecoForm.cep}
                          onChange={handleEnderecoChange}
                          className="h-12 rounded-2xl border-white/10 bg-black/40 px-4 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                        />
                        <Input
                          id="cidade"
                          name="cidade"
                          label="Cidade"
                          autoComplete="address-level2"
                          value={enderecoForm.cidade}
                          onChange={handleEnderecoChange}
                          className="h-12 rounded-2xl border-white/10 bg-black/40 px-4 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                        />
                        <Input
                          id="uf"
                          name="uf"
                          label="UF"
                          autoComplete="address-level1"
                          maxLength={2}
                          value={enderecoForm.uf}
                          onChange={handleEnderecoChange}
                          className="h-12 rounded-2xl border-white/10 bg-black/40 px-4 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            void handleSalvarNovoEndereco();
                          }}
                          disabled={isSavingAddress || isSubmitting}
                          className="rounded-xl border border-yellow-400/30 bg-yellow-400 px-4 py-2 text-sm font-semibold text-black transition hover:border-yellow-300 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSavingAddress
                            ? "Salvando endereco..."
                            : temEnderecoSalvo
                              ? "Salvar novo endereco"
                              : "Salvar primeiro endereco"}
                        </button>

                        <p className="text-sm text-zinc-400">
                          Salve o endereco para liberar a selecao de entrega e concluir a compra.
                        </p>
                      </div>

                      {temEnderecoSalvo ? (
                        <p className="mt-4 text-sm text-zinc-400">
                          Se você cancelar este formulário, o checkout volta a usar o endereço
                          selecionado acima.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-6">
              <button
                type="button"
                onClick={() => alternarEtapa("entrega")}
                className="mb-6 flex w-full items-start justify-between gap-4 border-b border-white/10 pb-5 text-left"
                aria-expanded={etapaAberta === "entrega"}
              >
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-yellow-400/80">
                    Etapa 2
                  </span>
                  <h2 className="text-2xl font-semibold text-white">Opções de entrega</h2>
                  <p className="text-sm leading-6 text-zinc-400">
                    Escolha a modalidade que melhor se encaixa no seu prazo e preferencia.
                  </p>
                </div>

                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-zinc-300 transition hover:border-yellow-400/40 hover:text-yellow-300">
                  {etapaAberta === "entrega" ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </span>
              </button>

              {etapaAberta === "entrega" ? (
                <fieldset className="space-y-4">
                  {isLoadingEntregas ? (
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-zinc-300">
                      Carregando opções de entrega de cada loja...
                    </div>
                  ) : null}

                  {carrinhoTemLojasInvalidas ? (
                    <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-5 text-sm text-zinc-300">
                      Não foi possível identificar a loja de um ou mais itens do carrinho.
                    </div>
                  ) : null}

                  {!isLoadingEntregas && gruposCarrinhoValidos.length > 0 ? (
                    <div className="space-y-4">
                      {gruposCarrinhoValidos.map((grupo) => {
                        const opcoesLoja = opcoesEntregaPorLoja[grupo.lojaId] ?? [];
                        const erroEntregaLoja = errosEntregaPorLoja[grupo.lojaId];
                        const freteSelecionadoLoja = fretesSelecionadosPorLoja[grupo.lojaId];

                        return (
                          <div
                            key={grupo.lojaId}
                            className="rounded-2xl border border-white/10 bg-black/20 p-4"
                          >
                            <div className="mb-4 flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-white">{grupo.lojaNome}</h3>
                                <p className="mt-1 text-sm text-zinc-400">
                                  {grupo.itens.length} item(ns) neste pedido - Subtotal {formatarMoeda(grupo.subtotal)}
                                </p>
                              </div>
                              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/80">
                                Entrega por loja
                              </span>
                            </div>

                            {erroEntregaLoja ? (
                              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-5 text-sm text-zinc-300">
                                {erroEntregaLoja}
                              </div>
                            ) : null}

                            {!erroEntregaLoja && opcoesLoja.length > 0 ? (
                              <div className="grid gap-3">
                                {opcoesLoja.map((opcao) => {
                                  const selecionado = freteSelecionadoLoja === opcao.id;

                                  return (
                                    <label
                                      key={opcao.id}
                                      htmlFor={`frete-${grupo.lojaId}-${opcao.id}`}
                                      className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition duration-200 hover:border-yellow-400/60 hover:bg-black/30 ${
                                        selecionado
                                          ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_0_1px_rgba(250,204,21,0.20)]"
                                          : "border-white/10 bg-black/20"
                                      }`}
                                    >
                                      <input
                                        id={`frete-${grupo.lojaId}-${opcao.id}`}
                                        type="radio"
                                        name={`frete-loja-${grupo.lojaId}`}
                                        checked={selecionado}
                                        onChange={() => handleSelecionarFreteLoja(grupo.lojaId, opcao.id)}
                                        className="mt-1 h-4 w-4 border-white/20 bg-transparent text-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
                                      />

                                      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                          <p className="font-semibold text-white">{opcao.nome}</p>
                                          <p className="text-sm text-zinc-400">
                                            {opcao.tipoEntrega} - {formatarPrazoEntrega(opcao.prazoEntregaDias)}
                                          </p>
                                          {opcao.observacao?.trim() ? (
                                            <p className="mt-1 text-xs text-zinc-500">
                                              {opcao.observacao.trim()}
                                            </p>
                                          ) : null}
                                        </div>
                                        <span className="text-sm font-semibold text-yellow-400">
                                          {formatarMoeda(opcao.valorFrete)}
                                        </span>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </fieldset>
              ) : null}
            </section>

            <section className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-6">
              <button
                type="button"
                onClick={() => alternarEtapa("pagamento")}
                className="mb-6 flex w-full items-start justify-between gap-4 border-b border-white/10 pb-5 text-left"
                aria-expanded={etapaAberta === "pagamento"}
              >
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-yellow-400/80">
                    Etapa 3
                  </span>
                  <h2 className="text-2xl font-semibold text-white">Forma de pagamento</h2>
                  <p className="text-sm leading-6 text-zinc-400">
                    Selecione a forma de pagamento desejada para concluir seu checkout.
                  </p>
                </div>

                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-zinc-300 transition hover:border-yellow-400/40 hover:text-yellow-300">
                  {etapaAberta === "pagamento" ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </span>
              </button>

              {etapaAberta === "pagamento" ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {METODOS_PAGAMENTO.map((tipo) => {
                  const selecionado = metodo === tipo.id;
                  const indisponivel = tipo.id === "boleto";

                  return (
                    <button
                      key={tipo.id}
                      type="button"
                      onClick={() => setMetodo(tipo.id)}
                      aria-pressed={selecionado}
                      disabled={indisponivel}
                      className={`rounded-2xl border p-4 text-left transition duration-200 hover:border-yellow-400/60 hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 ${
                        selecionado
                          ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_0_1px_rgba(250,204,21,0.20)]"
                          : "border-white/10 bg-black/20"
                      } ${indisponivel ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{tipo.titulo}</p>
                          <p className="mt-1 text-sm leading-6 text-zinc-400">
                            {tipo.descricao}
                          </p>
                          {indisponivel ? (
                            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-yellow-400/80">
                              Em breve
                            </p>
                          ) : null}
                        </div>
                        <span
                          className={`mt-1 h-3 w-3 rounded-full transition ${
                            selecionado
                              ? "bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.65)]"
                              : "bg-white/20"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {metodo === "credito" ? (
                <div className="mt-5 grid grid-cols-1 gap-4 rounded-2xl border border-yellow-400/20 bg-black/30 p-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Input
                      required
                      id="numero-cartao"
                      name="numeroCartao"
                      label="Número do cartão"
                      placeholder="0000 0000 0000 0000"
                      inputMode="numeric"
                      maxLength={23}
                      autoComplete="cc-number"
                      value={pagamentoCartaoForm.numeroCartao}
                      onChange={handlePagamentoCartaoChange}
                      className="h-12 rounded-2xl border-white/10 bg-black/40 px-4 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                    />
                  </div>
                  <Input
                    required
                    id="validade-cartao"
                    name="validadeCartao"
                    label="Validade"
                    placeholder="MM/AA"
                    inputMode="numeric"
                    maxLength={5}
                    autoComplete="cc-exp"
                    value={pagamentoCartaoForm.validadeCartao}
                    onChange={handlePagamentoCartaoChange}
                    className="h-12 rounded-2xl border-white/10 bg-black/40 px-4 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  />
                  <Input
                    required
                    id="nome-cartao"
                    name="nomeCartao"
                    label="Nome impresso no cartão"
                    placeholder="Como aparece no cartão"
                    autoComplete="cc-name"
                    value={pagamentoCartaoForm.nomeCartao}
                    onChange={handlePagamentoCartaoChange}
                    className="h-12 rounded-2xl border-white/10 bg-black/40 px-4 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  />
                </div>
              ) : null}

              {metodo === "pix" ? (
                <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-black/30 p-4">
                  <p className="text-sm leading-6 text-neutral-400">
                    O pagamento fake será confirmado automaticamente ao finalizar a compra.
                  </p>
                </div>
              ) : null}

                  {metodo === "debito" ? (
                <div className="mt-5 grid grid-cols-1 gap-4 rounded-2xl border border-yellow-400/20 bg-black/30 p-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Input
                      required
                      id="numero-cartao"
                      name="numeroCartao"
                      label="Numero do cartão"
                      placeholder="0000 0000 0000 0000"
                      inputMode="numeric"
                      maxLength={23}
                      autoComplete="cc-number"
                      value={pagamentoCartaoForm.numeroCartao}
                      onChange={handlePagamentoCartaoChange}
                      className="h-12 rounded-2xl border-white/10 bg-black/40 px-4 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                    />
                  </div>
                  <Input
                    required
                    id="validade-cartao"
                    name="validadeCartao"
                    label="Validade"
                    placeholder="MM/AA"
                    inputMode="numeric"
                    maxLength={5}
                    autoComplete="cc-exp"
                    value={pagamentoCartaoForm.validadeCartao}
                    onChange={handlePagamentoCartaoChange}
                    className="h-12 rounded-2xl border-white/10 bg-black/40 px-4 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  />
                  <Input
                    required
                    id="nome-cartao"
                    name="nomeCartao"
                    label="Nome impresso no cartão"
                    placeholder="Como aparece no cartão"
                    autoComplete="cc-name"
                    value={pagamentoCartaoForm.nomeCartao}
                    onChange={handlePagamentoCartaoChange}
                    className="h-12 rounded-2xl border-white/10 bg-black/40 px-4 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  />
                </div>
                  ) : null}
                </>
              ) : null}
            </section>
          </div>

          <div className="lg:col-span-1 lg:self-start">
            <aside className="space-y-4 rounded-2xl border border-white/10 p-5 lg:sticky lg:top-28">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-xl font-semibold">Totais do pedido</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Este bloco acompanha a rolagem para você revisar subtotal, frete e total a
                  qualquer momento.
                </p>
              </div>

              <div className="pt-1">
                {resumoCheckoutPorLoja.length > 0 ? (
                  <div className="mb-5 space-y-3 border-b border-white/10 pb-4">
                    <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.18em] text-yellow-400/80">
                      <span>Resumo por loja</span>
                      <span>{resumoCheckoutPorLoja.length} loja(s)</span>
                    </div>

                    {resumoCheckoutPorLoja.map((resumoLoja) => (
                      <div
                        key={resumoLoja.lojaId}
                        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{resumoLoja.lojaNome}</p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {resumoLoja.quantidadeItens} item(ns) neste pedido
                            </p>
                          </div>

                          <p className="text-sm font-semibold text-emerald-300">
                            {formatarMoeda(resumoLoja.total)}
                          </p>
                        </div>

                        <div className="mt-3 space-y-2 text-sm text-zinc-300">
                          <div className="flex items-center justify-between gap-3">
                            <span>Subtotal da loja</span>
                            <span>{formatarMoeda(resumoLoja.subtotal)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>Frete da loja</span>
                            <span>
                              {isLoadingEntregas
                                ? "Calculando..."
                                : formatarMoeda(resumoLoja.frete)}
                            </span>
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-zinc-500">
                          {resumoLoja.erroEntrega
                            ? resumoLoja.erroEntrega
                            : resumoLoja.descricaoEntrega}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-zinc-300">
                    <span>Subtotal dos produtos</span>
                    <span>{formatarMoeda(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-zinc-300">
                    <span>Frete total</span>
                    <span>
                      {isLoadingEntregas ? "Calculando..." : formatarMoeda(valorFreteSelecionado)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex text-[30px] font-bold">
                  <p className="px-3">Total geral:</p>
                  <p className="text-emerald-300">{formatarMoeda(total)}</p>
                </div>
              </div>

              {erro ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {erro}
                </div>
              ) : null}

              <button
                className="w-full rounded-xl bg-yellow-400 py-3 text-black disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  void handleFinalizarCompra();
                }}
                disabled={
                  isSavingAddress ||
                  isSubmitting ||
                  isLoadingEntregas ||
                  !estaAutenticado ||
                  carrinhoItens.length === 0 ||
                  !checkoutTemEntregasValidas
                }
              >
                {isSubmitting ? "Processando..." : "Finalizar compra"}
              </button>
            </aside>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
