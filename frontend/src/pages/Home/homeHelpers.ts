import type { LojaPublicaResumo } from "../../Services/user/lojaPublicaService";
import type { PedidoLeituraApiResponse } from "../../Services/user/usuarioService";
import type { HomeCategory, HomeProduct, HomeStore } from "../../types/home";

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function resolverIconeCategoria(categoria: string): HomeCategory["icone"] {
  const categoriaNormalizada = normalizarTexto(categoria);

  if (categoriaNormalizada.includes("roupa") || categoriaNormalizada.includes("moda")) {
    return "shirt";
  }

  if (
    categoriaNormalizada.includes("jogo") ||
    categoriaNormalizada.includes("game") ||
    categoriaNormalizada.includes("aposta")
  ) {
    return "gamepad";
  }

  if (categoriaNormalizada.includes("casa") || categoriaNormalizada.includes("movel")) {
    return "sofa";
  }

  if (categoriaNormalizada.includes("audio") || categoriaNormalizada.includes("fone")) {
    return "headphones";
  }

  if (
    categoriaNormalizada.includes("acessorio") ||
    categoriaNormalizada.includes("relogio")
  ) {
    return "watch";
  }

  return "smartphone";
}

export function criarCategoriasHome(produtos: HomeProduct[]) {
  return [
    { id: "todos", nome: "Todos", icone: "smartphone" as const },
    ...produtos
      .reduce<HomeCategory[]>((acumulador, produto) => {
        const jaExiste = acumulador.some((categoria) => categoria.id === produto.categoriaId);

        if (!jaExiste) {
          acumulador.push({
            id: produto.categoriaId,
            nome: produto.categoriaNome,
            icone: resolverIconeCategoria(produto.categoriaNome),
          });
        }

        return acumulador;
      }, [])
      .sort((categoriaAtual, proximaCategoria) =>
        categoriaAtual.nome.localeCompare(proximaCategoria.nome),
      ),
  ];
}

function calcularPontuacaoProdutoDestaque(produto: HomeProduct) {
  return (
    (produto.totalVisualizacoes ?? 0) * 4 +
    (produto.totalAvaliacoes ?? 0) * 8 +
    produto.avaliacao * 20 +
    Math.min(produto.estoque ?? 0, 50) * 0.35
  );
}

export function criarProdutosEmDestaque(produtos: HomeProduct[], limite = 10) {
  return [...produtos]
    .sort((produtoAtual, proximoProduto) => {
      const diferencaPontuacao =
        calcularPontuacaoProdutoDestaque(proximoProduto) -
        calcularPontuacaoProdutoDestaque(produtoAtual);

      if (diferencaPontuacao !== 0) {
        return diferencaPontuacao;
      }

      return proximoProduto.id - produtoAtual.id;
    })
    .slice(0, limite);
}

export function selecionarProdutosPorIds(
  produtos: HomeProduct[],
  ids: number[],
  limite = 10,
) {
  const produtosPorId = new Map(produtos.map((produto) => [produto.id, produto]));
  const produtosSelecionados: HomeProduct[] = [];

  for (const id of ids) {
    const produto = produtosPorId.get(id);

    if (!produto || produtosSelecionados.some((item) => item.id === produto.id)) {
      continue;
    }

    produtosSelecionados.push(produto);

    if (produtosSelecionados.length >= limite) {
      break;
    }
  }

  return produtosSelecionados;
}

export function criarIdsProdutosCompradosRecentemente(
  pedidos: PedidoLeituraApiResponse[],
  limite = 20,
) {
  const ids = new Set<number>();

  const pedidosOrdenados = [...pedidos].sort(
    (pedidoAtual, proximoPedido) =>
      new Date(proximoPedido.dataPedido).getTime() - new Date(pedidoAtual.dataPedido).getTime(),
  );

  for (const pedido of pedidosOrdenados) {
    for (const item of pedido.itens) {
      if (!item.produtoId || ids.has(item.produtoId)) {
        continue;
      }

      ids.add(item.produtoId);

      if (ids.size >= limite) {
        return Array.from(ids);
      }
    }
  }

  return Array.from(ids);
}

export function criarIdsLojasCompradasRecentemente(
  pedidos: PedidoLeituraApiResponse[],
  limite = 10,
) {
  const ids = new Set<number>();

  const pedidosOrdenados = [...pedidos].sort(
    (pedidoAtual, proximoPedido) =>
      new Date(proximoPedido.dataPedido).getTime() - new Date(pedidoAtual.dataPedido).getTime(),
  );

  for (const pedido of pedidosOrdenados) {
    for (const item of pedido.itens) {
      if (!item.lojaId || ids.has(item.lojaId)) {
        continue;
      }

      ids.add(item.lojaId);

      if (ids.size >= limite) {
        return Array.from(ids);
      }
    }
  }

  return Array.from(ids);
}

export function agruparLojasCatalogo(produtos: HomeProduct[]) {
  const lojas = new Map<
    number,
    Omit<HomeStore, "mediaAvaliacao" | "totalAvaliacoes" | "totalVisualizacoes" | "pontuacao"> & {
      somaAvaliacao: number;
      somaPesos: number;
      totalAvaliacoes: number;
    }
  >();

  for (const produto of produtos) {
    if (!produto.lojaId) {
      continue;
    }

    const lojaAtual = lojas.get(produto.lojaId);
    const pesoAvaliacao = Math.max(produto.totalAvaliacoes ?? 0, 1);

    if (!lojaAtual) {
      lojas.set(produto.lojaId, {
        id: produto.lojaId,
        nome: produto.lojaNome?.trim() || `Loja ${produto.lojaId}`,
        avatarUrl: produto.lojaAvatarUrl,
        descricao: "",
        cidade: "",
        uf: "",
        totalProdutos: 1,
        categorias: [produto.categoriaNome],
        somaAvaliacao: produto.avaliacao * pesoAvaliacao,
        somaPesos: pesoAvaliacao,
        totalAvaliacoes: produto.totalAvaliacoes ?? 0,
      });
      continue;
    }

    lojaAtual.totalProdutos += 1;
    lojaAtual.somaAvaliacao += produto.avaliacao * pesoAvaliacao;
    lojaAtual.somaPesos += pesoAvaliacao;
    lojaAtual.totalAvaliacoes += produto.totalAvaliacoes ?? 0;

    if (!lojaAtual.avatarUrl && produto.lojaAvatarUrl) {
      lojaAtual.avatarUrl = produto.lojaAvatarUrl;
    }

    if (!lojaAtual.categorias.includes(produto.categoriaNome)) {
      lojaAtual.categorias.push(produto.categoriaNome);
    }
  }

  return Array.from(lojas.values())
    .map((loja) => {
      const mediaAvaliacao = loja.somaPesos > 0 ? loja.somaAvaliacao / loja.somaPesos : 0;
      const pontuacao = loja.totalAvaliacoes * 4 + mediaAvaliacao * 20 + loja.totalProdutos * 3;

      return {
        id: loja.id,
        nome: loja.nome,
        avatarUrl: loja.avatarUrl,
        descricao: loja.descricao,
        cidade: loja.cidade,
        uf: loja.uf,
        totalProdutos: loja.totalProdutos,
        categorias: loja.categorias.slice(0, 4),
        mediaAvaliacao,
        totalAvaliacoes: loja.totalAvaliacoes,
        totalVisualizacoes: 0,
        pontuacao,
      };
    })
    .sort((lojaAtual, proximaLoja) => {
      const diferencaPontuacao = proximaLoja.pontuacao - lojaAtual.pontuacao;

      if (diferencaPontuacao !== 0) {
        return diferencaPontuacao;
      }

      return proximaLoja.totalProdutos - lojaAtual.totalProdutos;
    });
}

export function selecionarLojasPorIds(lojas: HomeStore[], ids: number[], limite = 10) {
  const lojasPorId = new Map(lojas.map((loja) => [loja.id, loja]));
  const lojasSelecionadas: HomeStore[] = [];

  for (const id of ids) {
    const loja = lojasPorId.get(id);

    if (!loja || lojasSelecionadas.some((item) => item.id === loja.id)) {
      continue;
    }

    lojasSelecionadas.push(loja);

    if (lojasSelecionadas.length >= limite) {
      break;
    }
  }

  return lojasSelecionadas;
}

export function mapearLojasPublicasParaHome(lojas: LojaPublicaResumo[]) {
  return lojas
    .filter((loja): loja is LojaPublicaResumo & { id: number } => typeof loja.id === "number")
    .map((loja) => ({
      id: loja.id,
      nome: loja.nomeFantasia?.trim() || `Loja ${loja.id}`,
      avatarUrl: loja.avatarUrl ?? loja.fotoPerfilUrl ?? loja.logoUrl ?? undefined,
      descricao: loja.descricao?.trim() || "",
      cidade: loja.cidade?.trim() || "",
      uf: loja.uf?.trim() || "",
      mediaAvaliacao: Number(loja.mediaAvaliacao ?? 0),
      totalAvaliacoes: Number(loja.totalAvaliacoes ?? 0),
      totalProdutos: Number(loja.totalProdutosAtivos ?? 0),
      categorias: [],
      totalVisualizacoes: Number(loja.totalVisualizacoes ?? 0),
      pontuacao:
        Number(loja.totalVisualizacoes ?? 0) * 5 +
        Number(loja.totalAvaliacoes ?? 0) * 4 +
        Number(loja.mediaAvaliacao ?? 0) * 20 +
        Number(loja.totalProdutosAtivos ?? 0) * 3,
    }))
    .sort((lojaAtual, proximaLoja) => proximaLoja.pontuacao - lojaAtual.pontuacao);
}

export function mesclarLojasHome(lojasPrioritarias: HomeStore[], lojasCatalogo: HomeStore[]) {
  const lojasCatalogoPorId = new Map(lojasCatalogo.map((loja) => [loja.id, loja]));
  const lojasMescladas: HomeStore[] = [];
  const idsAdicionados = new Set<number>();

  function adicionarLoja(lojaBase: HomeStore) {
    if (idsAdicionados.has(lojaBase.id)) {
      return;
    }

    const lojaCatalogo = lojasCatalogoPorId.get(lojaBase.id);
    const lojaMesclada: HomeStore = lojaCatalogo
      ? {
          ...lojaCatalogo,
          ...lojaBase,
          avatarUrl: lojaBase.avatarUrl || lojaCatalogo.avatarUrl,
          descricao: lojaBase.descricao || lojaCatalogo.descricao,
          cidade: lojaBase.cidade || lojaCatalogo.cidade,
          uf: lojaBase.uf || lojaCatalogo.uf,
          totalProdutos: lojaBase.totalProdutos || lojaCatalogo.totalProdutos,
          categorias: lojaCatalogo.categorias.length > 0 ? lojaCatalogo.categorias : lojaBase.categorias,
          mediaAvaliacao: lojaBase.mediaAvaliacao || lojaCatalogo.mediaAvaliacao,
          totalAvaliacoes: lojaBase.totalAvaliacoes || lojaCatalogo.totalAvaliacoes,
          totalVisualizacoes:
            lojaBase.totalVisualizacoes || lojaCatalogo.totalVisualizacoes || 0,
          pontuacao: Math.max(lojaBase.pontuacao, lojaCatalogo.pontuacao),
        }
      : {
          ...lojaBase,
          totalVisualizacoes: lojaBase.totalVisualizacoes ?? 0,
        };

    lojasMescladas.push(lojaMesclada);
    idsAdicionados.add(lojaBase.id);
  }

  lojasPrioritarias.forEach(adicionarLoja);
  lojasCatalogo.forEach(adicionarLoja);

  return lojasMescladas;
}

export function criarCategoriasPreferidas(produtos: HomeProduct[], limite = 3) {
  const contagemCategorias = new Map<string, number>();

  produtos.forEach((produto, indice) => {
    const peso = Math.max(produtos.length - indice, 1);
    const pontuacaoAtual = contagemCategorias.get(produto.categoriaId) ?? 0;

    contagemCategorias.set(produto.categoriaId, pontuacaoAtual + peso);
  });

  return Array.from(contagemCategorias.entries())
    .sort((categoriaAtual, proximaCategoria) => proximaCategoria[1] - categoriaAtual[1])
    .slice(0, limite)
    .map(([categoriaId]) => categoriaId);
}

type CriarProdutosRecomendadosParams = {
  produtos: HomeProduct[];
  idsCategoriasPreferidas: string[];
  idsLojasPrioritarias: number[];
  idsProdutosPrioritarios?: number[];
  idsProdutosIgnorados?: number[];
  limite?: number;
};

export function criarProdutosRecomendados({
  produtos,
  idsCategoriasPreferidas,
  idsLojasPrioritarias,
  idsProdutosPrioritarios = [],
  idsProdutosIgnorados = [],
  limite = 15,
}: CriarProdutosRecomendadosParams) {
  const categoriasPreferidas = new Set(idsCategoriasPreferidas);
  const lojasPrioritarias = new Set(idsLojasPrioritarias);
  const produtosPrioritarios = new Set(idsProdutosPrioritarios);
  const produtosIgnorados = new Set(idsProdutosIgnorados);

  const produtosOrdenados = [...produtos]
    .map((produto) => {
      let pontuacao = calcularPontuacaoProdutoDestaque(produto);

      if (lojasPrioritarias.has(produto.lojaId ?? 0)) {
        pontuacao += 40;
      }

      if (categoriasPreferidas.has(produto.categoriaId)) {
        pontuacao += 32;
      }

      if (produtosPrioritarios.has(produto.id)) {
        pontuacao += 18;
      }

      if (produtosIgnorados.has(produto.id)) {
        pontuacao -= 14;
      }

      return {
        produto,
        pontuacao,
      };
    })
    .sort((produtoAtual, proximoProduto) => proximoProduto.pontuacao - produtoAtual.pontuacao);

  const recomendados: HomeProduct[] = [];

  for (const item of produtosOrdenados) {
    if (recomendados.some((produto) => produto.id === item.produto.id)) {
      continue;
    }

    recomendados.push(item.produto);

    if (recomendados.length >= limite) {
      break;
    }
  }

  return recomendados;
}
