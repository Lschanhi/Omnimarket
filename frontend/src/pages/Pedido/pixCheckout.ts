import { formatarCep, formatarCpf } from "../../utils/masks";

export type PixCheckoutItem = {
  produtoId: number;
  nome: string;
  quantidade: number;
  subtotal: number;
};

export type PixCheckoutLojaResumo = {
  lojaId: number;
  lojaNome: string;
  quantidadeItens: number;
  subtotal: number;
  frete: number;
  total: number;
  descricaoEntrega: string;
  tipoEntregaId: number;
  itens: PixCheckoutItem[];
};

export type PixCheckoutEnderecoResumo = {
  tipoLogradouro: string;
  nomeEndereco: string;
  numero: string;
  complemento?: string;
  cep: string;
  cidade: string;
  uf: string;
  isPrincipal: boolean;
};

export type PixCheckoutEnderecoState =
  | {
      mode: "existing";
      enderecoId: number;
      resumo: PixCheckoutEnderecoResumo;
    }
  | {
      mode: "new";
      resumo: PixCheckoutEnderecoResumo;
    };

export type PixCheckoutCompradorResumo = {
  id: number;
  nome: string;
  email: string;
  cpf: string;
};

export type PixCheckoutReviewState = {
  comprador: PixCheckoutCompradorResumo;
  endereco: PixCheckoutEnderecoState;
  lojas: PixCheckoutLojaResumo[];
  subtotal: number;
  freteTotal: number;
  total: number;
  formaPagamentoId: number;
  metodoPagamentoCodigo: string;
  metodoPagamentoTitulo: string;
  detalhePagamento?: string;
  redirecionamentoQrUrl: string;
};

export type PixCheckoutPedidoPendente = {
  pedidoId: number;
  planoPagamentoId: number;
  lojaNome: string;
  total: number;
  statusPagamento: string;
  itens: PixCheckoutItem[];
};

export type PixCheckoutPendingState = {
  comprador: PixCheckoutCompradorResumo;
  endereco: PixCheckoutEnderecoResumo;
  pedidos: PixCheckoutPedidoPendente[];
  subtotal: number;
  freteTotal: number;
  total: number;
  metodoPagamentoTitulo: string;
  redirecionamentoQrUrl: string;
  codigoPixFake: string;
  qrCodeUrl: string;
};

export type CheckoutPedidoProcessadoResumo = {
  pedidoId: number;
  lojaNome: string;
  total: number;
  statusPagamento: string;
  itens: PixCheckoutItem[];
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function normalizarTextoQr(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .toUpperCase();
}

export function formatarMoedaCheckout(valor: number) {
  return currencyFormatter.format(valor);
}

export function formatarCpfCheckout(cpf: string) {
  return formatarCpf(cpf);
}

export function formatarEnderecoCompacto(endereco: PixCheckoutEnderecoResumo) {
  return `${endereco.tipoLogradouro} ${endereco.nomeEndereco}, ${endereco.numero}`;
}

export function formatarEnderecoCompleto(endereco: PixCheckoutEnderecoResumo) {
  const partes = [formatarEnderecoCompacto(endereco)];

  if (endereco.complemento?.trim()) {
    partes.push(endereco.complemento.trim());
  }

  partes.push(`${endereco.cidade}/${endereco.uf.toUpperCase()}`);
  partes.push(`CEP ${formatarCep(endereco.cep)}`);

  return partes.join(" - ");
}

export function calcularStatusPagamentoFinal(pedidos: CheckoutPedidoProcessadoResumo[]) {
  return pedidos.every(
    (pedidoAtual) => pedidoAtual.statusPagamento === pedidos[0]?.statusPagamento,
  )
    ? pedidos[0]?.statusPagamento ?? "Confirmado"
    : "Confirmado parcialmente";
}

export function criarCheckoutResultState({
  pedidosProcessados,
  totalCheckout,
  metodoPagamento,
}: {
  pedidosProcessados: CheckoutPedidoProcessadoResumo[];
  totalCheckout: number;
  metodoPagamento: string;
}) {
  const todosItens = pedidosProcessados.flatMap((pedidoAtual) => pedidoAtual.itens);

  return {
    pedidoId: pedidosProcessados[0]?.pedidoId ?? 0,
    pedidoIds: pedidosProcessados.map((pedidoAtual) => pedidoAtual.pedidoId),
    pedidos: pedidosProcessados,
    total: totalCheckout,
    metodoPagamento,
    statusPagamento: calcularStatusPagamentoFinal(pedidosProcessados),
    itens: todosItens.map((item) => ({
      produtoId: item.produtoId,
      nome: item.nome,
      quantidade: item.quantidade,
      subtotal: item.subtotal,
    })),
  };
}

export function criarCodigoPixFake({
  pedidoPrincipalId,
  total,
  nomeComprador,
}: {
  pedidoPrincipalId: number;
  total: number;
  nomeComprador: string;
}) {
  const valorNormalizado = total.toFixed(2);
  const compradorNormalizado = normalizarTextoQr(nomeComprador).replace(/\s+/g, "").slice(0, 12);
  const tokenBase = `${pedidoPrincipalId}${valorNormalizado.replace(/\D/g, "")}${compradorNormalizado}`;
  const token = tokenBase.padEnd(24, "7").slice(0, 24);

  return [
    "000201",
    "010212",
    "26360014BR.GOV.BCB.PIX0114omnimarket.fake",
    `52040000`,
    "5303986",
    `540${valorNormalizado.length}${valorNormalizado}`,
    "5802BR",
    `5913${compradorNormalizado || "COMPRADORPIX"}`,
    "6009SAOPAULO",
    `62100506${String(pedidoPrincipalId).padStart(6, "0")}`,
    `6304${token.slice(0, 4)}`,
    token,
  ].join("");
}
