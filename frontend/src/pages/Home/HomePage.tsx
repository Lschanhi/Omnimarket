import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDownWideNarrow } from "lucide-react";
import { Banner } from "../../Components/home/Banner";
import { CategoryList } from "../../Components/home/CategoryList";
import { ProductShelf } from "../../Components/home/ProductShelf";
import { SearchBar } from "../../Components/home/SearchBar";
import { Spotlight } from "../../Components/home/SpotLight";
import { StoreGrid } from "../../Components/home/StoreGrid";
import { PageLayout } from "../../Components/PageLayout";
import { createMockImage } from "../../data/produtos";
import { AUTH_CHANGED_EVENT, isAuthenticated } from "../../Services/auth/session";
import {
  obterIdsLojasRecentes,
  obterIdsProdutosRecentes,
} from "../../Services/home/homeHistoryService";
import {
  listarProdutos,
  listarProdutosEmDestaque,
} from "../../Services/produtos/produtoService";
import {
  listarLojasEmDestaque,
  type LojaPublicaResumo,
} from "../../Services/user/lojaPublicaService";
import {
  listarPedidosUsuario,
  obterPerfilUsuario,
  type PedidoLeituraApiResponse,
} from "../../Services/user/usuarioService";
import type { HomeProduct } from "../../types/home";
import {
  agruparLojasCatalogo,
  criarCategoriasHome,
  criarCategoriasPreferidas,
  criarIdsLojasCompradasRecentemente,
  criarIdsProdutosCompradosRecentemente,
  mapearLojasPublicasParaHome,
  mesclarLojasHome,
  criarProdutosEmDestaque,
  criarProdutosRecomendados,
  selecionarLojasPorIds,
  selecionarProdutosPorIds,
} from "./homeHelpers";

type VitrineSectionHeaderProps = {
  titulo: string;
  descricao: string;
  extra?: ReactNode;
};

function VitrineSectionHeader({
  titulo,
  descricao,
  extra,
}: VitrineSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">{titulo}</h2>
        <p className="text-sm text-neutral-400">{descricao}</p>
      </div>

      {extra ? <div>{extra}</div> : null}
    </div>
  );
}

export function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [produtosEmDestaqueApi, setProdutosEmDestaqueApi] = useState<HomeProduct[]>([]);
  const [lojasEmDestaqueApi, setLojasEmDestaqueApi] = useState<LojaPublicaResumo[]>([]);
  const [pedidosUsuario, setPedidosUsuario] = useState<PedidoLeituraApiResponse[]>([]);
  const [loadError, setLoadError] = useState("");
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(() => isAuthenticated());

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    function sincronizarAutenticacao() {
      setUsuarioAutenticado(isAuthenticated());
    }

    window.addEventListener(AUTH_CHANGED_EVENT, sincronizarAutenticacao);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sincronizarAutenticacao);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function carregarVitrine() {
      setIsLoading(true);
      setLoadError("");

      try {
        const [produtosCatalogo, produtosDestaqueBackend, lojasDestaqueBackend] =
          await Promise.all([
            listarProdutos(),
            listarProdutosEmDestaque(10).catch(() => []),
            listarLojasEmDestaque(10).catch(() => []),
          ]);

        if (!isMounted) {
          return;
        }

        const produtosDisponiveis = produtosCatalogo.filter(
          (produto) => produto.disponivel !== false,
        );

        let pedidos: PedidoLeituraApiResponse[] = [];

        if (usuarioAutenticado) {
          try {
            const perfil = await obterPerfilUsuario();
            pedidos = await listarPedidosUsuario(perfil.id).catch(() => []);
          } catch {
            pedidos = [];
          }
        }

        if (!isMounted) {
          return;
        }

        setProducts(produtosDisponiveis);
        setProdutosEmDestaqueApi(
          produtosDestaqueBackend.filter((produto) => produto.disponivel !== false),
        );
        setLojasEmDestaqueApi(lojasDestaqueBackend);
        setPedidosUsuario(pedidos);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Nao foi possivel carregar o catalogo.";

        setLoadError(message);
        setProducts([]);
        setProdutosEmDestaqueApi([]);
        setLojasEmDestaqueApi([]);
        setPedidosUsuario([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void carregarVitrine();

    return () => {
      isMounted = false;
    };
  }, [usuarioAutenticado]);

  const categories = useMemo(() => criarCategoriasHome(products), [products]);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtroAtivo = selectedCategory !== "todos" || normalizedSearch.length > 0;

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory =
          selectedCategory === "todos" || product.categoriaId === selectedCategory;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          product.nome.toLowerCase().includes(normalizedSearch) ||
          product.categoriaNome.toLowerCase().includes(normalizedSearch) ||
          (product.lojaNome ?? "").toLowerCase().includes(normalizedSearch);

        return matchesCategory && matchesSearch;
      }),
    [normalizedSearch, products, selectedCategory],
  );

  const activeCategoryName =
    categories.find((categoria) => categoria.id === selectedCategory)?.nome ?? "Todos";

  const lojasCatalogo = useMemo(() => agruparLojasCatalogo(products), [products]);
  const lojasHome = useMemo(
    () => mesclarLojasHome(mapearLojasPublicasParaHome(lojasEmDestaqueApi), lojasCatalogo),
    [lojasCatalogo, lojasEmDestaqueApi],
  );
  const produtosEmDestaque = useMemo(
    () =>
      produtosEmDestaqueApi.length > 0
        ? produtosEmDestaqueApi.slice(0, 10)
        : criarProdutosEmDestaque(products, 10),
    [products, produtosEmDestaqueApi],
  );
  const idsProdutosRecentes = obterIdsProdutosRecentes();
  const idsLojasRecentes = obterIdsLojasRecentes();
  const idsProdutosComprados = useMemo(
    () => criarIdsProdutosCompradosRecentemente(pedidosUsuario, 20),
    [pedidosUsuario],
  );
  const idsLojasCompradas = useMemo(
    () => criarIdsLojasCompradasRecentemente(pedidosUsuario, 10),
    [pedidosUsuario],
  );
  const produtosRecentes = useMemo(
    () => selecionarProdutosPorIds(products, idsProdutosRecentes, 10),
    [idsProdutosRecentes, products],
  );
  const produtosComprados = useMemo(
    () => selecionarProdutosPorIds(products, idsProdutosComprados, 10),
    [idsProdutosComprados, products],
  );
  const lojasRecentes = useMemo(
    () => selecionarLojasPorIds(lojasHome, idsLojasRecentes, 10),
    [idsLojasRecentes, lojasHome],
  );
  const lojasCompradas = useMemo(
    () => selecionarLojasPorIds(lojasHome, idsLojasCompradas, 10),
    [idsLojasCompradas, lojasHome],
  );

  const produtosVistosOuComprados = useMemo(() => {
    const produtosMesclados: HomeProduct[] = [];

    [...produtosRecentes, ...produtosComprados].forEach((produto) => {
      if (!produtosMesclados.some((item) => item.id === produto.id)) {
        produtosMesclados.push(produto);
      }
    });

    return produtosMesclados.slice(0, 10);
  }, [produtosComprados, produtosRecentes]);

  const lojasParaExplorar = useMemo(() => {
    if (usuarioAutenticado) {
      if (lojasRecentes.length > 0) {
        return lojasRecentes;
      }

      if (lojasCompradas.length > 0) {
        return lojasCompradas;
      }
    }

    return lojasHome.slice(0, 10);
  }, [lojasCompradas, lojasHome, lojasRecentes, usuarioAutenticado]);

  const categoriasPreferidas = useMemo(
    () => criarCategoriasPreferidas([...produtosRecentes, ...produtosComprados], 3),
    [produtosComprados, produtosRecentes],
  );

  const idsLojasPrioritarias = useMemo(() => {
    const idsHistorico = Array.from(new Set([...idsLojasRecentes, ...idsLojasCompradas]));

    if (idsHistorico.length > 0) {
      return idsHistorico;
    }

    return lojasHome.slice(0, 5).map((loja) => loja.id);
  }, [idsLojasCompradas, idsLojasRecentes, lojasHome]);

  const produtosRecomendados = useMemo(
    () =>
      criarProdutosRecomendados({
        produtos: products,
        idsCategoriasPreferidas: categoriasPreferidas,
        idsLojasPrioritarias,
        idsProdutosPrioritarios: [...idsProdutosRecentes, ...idsProdutosComprados],
        idsProdutosIgnorados: produtosVistosOuComprados.map((produto) => produto.id).slice(0, 4),
        limite: 15,
      }),
    [
      categoriasPreferidas,
      idsLojasPrioritarias,
      idsProdutosComprados,
      idsProdutosRecentes,
      products,
      produtosVistosOuComprados,
    ],
  );

  const tituloSecaoLojas = usuarioAutenticado
    ? lojasRecentes.length > 0
      ? "Ultimas lojas visualizadas"
      : lojasCompradas.length > 0
        ? "Lojas relacionadas as suas compras"
        : "Lojas em alta"
    : "Lojas em alta";

  const descricaoSecaoLojas = usuarioAutenticado
    ? lojasRecentes.length > 0
      ? "Retome as vitrines que voce abriu recentemente e continue navegando pelas lojas favoritas."
      : lojasCompradas.length > 0
        ? "Como ainda nao ha historico de visita recente, mostramos lojas ligadas ao que voce ja comprou."
        : "Enquanto seu historico cresce, usamos o catalogo ativo para destacar as lojas com melhor tracao."
    : "Sem login, a vitrine prioriza lojas com mais produtos ativos e melhor sinal de avaliacao no catalogo.";

  const tituloHistoricoProdutos = usuarioAutenticado
    ? "Ultimos vistos e comprados"
    : "Continue de onde voce parou";

  const descricaoHistoricoProdutos = usuarioAutenticado
    ? "Aqui entram os produtos que voce abriu recentemente e tambem itens ligados ao seu historico de compra."
    : "Mesmo sem login, a home lembra o que voce abriu por ultimo neste navegador.";

  return (
    <PageLayout>
      <div className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <Spotlight>
            <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.16),_transparent_48%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
              <div className="flex flex-col gap-6">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <h1 className="text-center text-3xl font-bold tracking-tight text-yellow-400 sm:text-5xl">
                      Bem-vindo ao OmniMarket
                    </h1>
                    <p className="text-center text-lg font-bold text-white">
                      Agora a vitrine inicial pode destacar produtos, lojas e recomendacoes com
                      base no comportamento do usuario.
                    </p>
                  </div>
                </div>

                <SearchBar value={searchTerm} onChange={setSearchTerm} />
              </div>
            </section>
          </Spotlight>

          <Spotlight>
            <div className="relative overflow-hidden">
              <Banner
                titulo="Semana OmniMarket com espaco para campanhas, ofertas e destaques patrocinados"
                descricao="Quando voce decidir ativar promocoes de verdade, este bloco pode virar o carrossel principal sem mexer no restante da home."
                imagem={createMockImage("Semana OmniMarket", "#eab308", "#111827")}
              />
            </div>
          </Spotlight>

          <CategoryList
            categorias={categories}
            categoriaAtiva={selectedCategory}
            onSelect={setSelectedCategory}
          />

          {filtroAtivo ? (
            <section className="space-y-5">
              <VitrineSectionHeader
                titulo={`Resultados para ${activeCategoryName}`}
                descricao={
                  normalizedSearch
                    ? `Mostrando produtos filtrados pela categoria ativa e pela busca "${searchTerm}".`
                    : "Mostrando os produtos da categoria selecionada."
                }
              />

              <ProductShelf
                produtos={filteredProducts}
                isLoading={isLoading}
                limite={10}
                modo="grid"
                mostrarResumo
                mensagemVazia={`Nenhum produto foi encontrado para ${activeCategoryName}${
                  normalizedSearch ? ` com a busca "${searchTerm}"` : ""
                }.`}
              />
            </section>
          ) : null}

          <section className="space-y-5">
            <VitrineSectionHeader
              titulo={tituloSecaoLojas}
              descricao={descricaoSecaoLojas}
            />

            <StoreGrid
              lojas={lojasParaExplorar}
              isLoading={isLoading}
              limite={10}
              mensagemVazia="Ainda nao encontramos lojas suficientes para montar esta prateleira."
            />
          </section>

          <section className="space-y-5">
            <VitrineSectionHeader
              titulo="Produtos em destaque"
              descricao="Hoje este bloco usa ranking por avaliacao, tracao do catalogo e estoque disponivel. Quando houver promocoes reais, ele pode priorizar campanhas."
              extra={
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300">
                  <ArrowDownWideNarrow className="h-4 w-4 text-yellow-400" />
                  Ordenacao: relevancia da vitrine
                </div>
              }
            />

            {loadError ? (
              <div className="rounded-[28px] border border-red-400/20 bg-red-500/5 px-5 py-4 text-sm text-red-200">
                {loadError}
              </div>
            ) : null}

            <ProductShelf
              produtos={produtosEmDestaque}
              isLoading={isLoading}
              limite={10}
              mostrarResumo
              mensagemVazia="Ainda nao ha produtos suficientes para montar a vitrine de destaque."
            />
          </section>

          {produtosVistosOuComprados.length > 0 ? (
            <section className="space-y-5">
              <VitrineSectionHeader
                titulo={tituloHistoricoProdutos}
                descricao={descricaoHistoricoProdutos}
              />

              <ProductShelf
                produtos={produtosVistosOuComprados}
                limite={10}
                mensagemVazia="Nenhum produto recente foi encontrado para esta prateleira."
              />
            </section>
          ) : null}

          <section className="space-y-5">
            <VitrineSectionHeader
              titulo={usuarioAutenticado ? "Recomendados para voce" : "Produtos para descobrir agora"}
              descricao={
                usuarioAutenticado
                  ? "Esta lista mistura produtos das lojas que voce mais toca e categorias ligadas ao que voce viu ou comprou."
                  : "Sem historico do comprador, a recomendacao mescla lojas em alta com categorias fortes do catalogo."
              }
            />

            <ProductShelf
              produtos={produtosRecomendados}
              isLoading={isLoading}
              limite={15}
              mostrarResumo
              mensagemVazia="Ainda nao foi possivel gerar recomendacoes para esta vitrine."
            />
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
