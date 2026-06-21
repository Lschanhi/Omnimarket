import { useEffect, useMemo, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { Star, Store } from "lucide-react";
import { AvaliacaoFeed } from "../../Components/AvaliacaoFeed";
import { ProductShelf } from "../../Components/home/ProductShelf";
import { PageLayout } from "../../Components/PageLayout";
import { StoreIdentityBadge } from "../../Components/produto/StoreIdentityBadge";
import { useCatalogoAutoRefresh } from "../../hooks/useCatalogoAutoRefresh";
import { registrarVisualizacaoLoja } from "../../Services/home/homeHistoryService";
import { listarAvaliacoesLoja } from "../../Services/produtos/avaliacaoService";
import { listarProdutos } from "../../Services/produtos/produtoService";
import {
  obterLojaPublica,
  type LojaPublicaResumo,
} from "../../Services/user/lojaPublicaService";
import type { ProdutoAvaliacaoLeitura } from "../../types/avaliacao";
import type { HomeProduct } from "../../types/home";

export function LojaPublicaPage() {
  const { id } = useParams({ strict: false });
  const lojaId = Number(id);
  const lojaIdValido = Number.isFinite(lojaId) && lojaId > 0;
  const [loja, setLoja] = useState<LojaPublicaResumo | null>(null);
  const [produtos, setProdutos] = useState<HomeProduct[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<ProdutoAvaliacaoLeitura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAvaliacoes, setIsLoadingAvaliacoes] = useState(true);
  const [erro, setErro] = useState("");
  const [erroAvaliacoes, setErroAvaliacoes] = useState("");
  const [reloadSeed, setReloadSeed] = useState(0);

  useEffect(() => {
    let isMounted = true;

    if (!lojaIdValido) {
      setErro("Loja invalida.");
      setIsLoading(false);
      setIsLoadingAvaliacoes(false);
      return;
    }

    async function carregarLoja() {
      setIsLoading(true);
      setIsLoadingAvaliacoes(true);
      setErro("");
      setErroAvaliacoes("");

      try {
        const [lojaResultado, produtosResultado, avaliacoesResultado] = await Promise.all([
          obterLojaPublica(lojaId, { registrarVisualizacao: true }),
          listarProdutos(),
          listarAvaliacoesLoja(lojaId, { pageSize: 10 }).catch((error) => error),
        ]);

        if (!isMounted) {
          return;
        }

        if (!lojaResultado?.id) {
          setLoja(null);
          setProdutos([]);
          setErro("Loja nao encontrada.");
          return;
        }

        registrarVisualizacaoLoja(lojaResultado.id);
        setLoja(lojaResultado);
        setProdutos(
          produtosResultado.filter(
            (produto) => produto.lojaId === lojaResultado.id && produto.disponivel !== false,
          ),
        );

        if (avaliacoesResultado instanceof Error) {
          setAvaliacoes([]);
          setErroAvaliacoes(avaliacoesResultado.message);
        } else {
          setAvaliacoes(avaliacoesResultado.items);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErro(error instanceof Error ? error.message : "Nao foi possivel carregar a loja.");
        setLoja(null);
        setProdutos([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsLoadingAvaliacoes(false);
        }
      }
    }

    void carregarLoja();

    return () => {
      isMounted = false;
    };
  }, [id, lojaId, lojaIdValido, reloadSeed]);

  useCatalogoAutoRefresh({
    enabled: lojaIdValido,
    intervalMs: 15000,
    onRefresh: () => setReloadSeed((currentSeed) => currentSeed + 1),
  });

  const categoriasLoja = useMemo(
    () =>
      Array.from(
        new Set(produtos.map((produto) => produto.categoriaNome.trim()).filter(Boolean)),
      ).slice(0, 6),
    [produtos],
  );

  if (!isLoading && (!loja || erro)) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <section className="w-full max-w-xl rounded-[28px] border border-yellow-400/20 bg-white/5 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
            <span className="inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1 text-sm font-medium text-yellow-300">
              Loja indisponivel
            </span>

            <h1 className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight text-white">
              Loja nao encontrada
            </h1>

            <p className="mt-3 text-sm leading-6 text-neutral-300 sm:text-base">
              {erro || "A vitrine solicitada nao foi localizada."}
            </p>
          </section>
        </div>
      </PageLayout>
    );
  }

  const localizacao = [loja?.cidade?.trim(), loja?.uf?.trim()].filter(Boolean).join(" / ");

  return (
    <PageLayout>
      <div className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.14),_transparent_48%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <StoreIdentityBadge
                  nome={loja?.nomeFantasia ?? "Loja OmniMarket"}
                  avatarUrl={loja?.avatarUrl ?? loja?.fotoPerfilUrl ?? loja?.logoUrl ?? undefined}
                />

                <div className="space-y-3">
                  <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                    {loja?.nomeFantasia ?? "Loja OmniMarket"}
                  </h1>

                  <p className="max-w-3xl text-sm leading-7 text-neutral-300 sm:text-base">
                    {loja?.descricao?.trim() ||
                      "Esta loja ainda nao publicou uma descricao institucional, mas ja possui produtos ativos na vitrine."}
                  </p>
                </div>

                {categoriasLoja.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {categoriasLoja.map((categoria) => (
                      <span
                        key={`${loja?.id ?? "loja"}-${categoria}`}
                        className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-200"
                      >
                        {categoria}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Produtos</p>
                  <p className="mt-2 text-2xl font-bold text-white">{produtos.length}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Avaliacao</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-2xl font-bold text-white">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    {(loja?.mediaAvaliacao ?? 0).toFixed(1)}
                  </p>
                  <p className="mt-1 text-sm text-neutral-400">
                    {loja?.totalAvaliacoes ?? 0} avaliacao(oes)
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Presenca</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-white">
                    <Store className="h-5 w-5 text-yellow-400" />
                    {localizacao || "Marketplace online"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">Produtos desta loja</h2>
              <p className="text-sm text-neutral-400">
                Explore a vitrine publica da loja e abra os detalhes de cada item.
              </p>
            </div>

            <ProductShelf
              produtos={produtos}
              isLoading={isLoading}
              limite={Math.max(produtos.length, 1)}
              mostrarResumo
              mensagemVazia="Esta loja ainda nao possui produtos ativos publicados na vitrine."
            />
          </section>

          <AvaliacaoFeed
            titulo="Avaliacoes desta loja"
            descricao={
              loja?.totalAvaliacoes && loja.totalAvaliacoes > avaliacoes.length
                ? `Mostrando as avaliacoes mais recentes. A loja soma ${loja.totalAvaliacoes} registro(s) no total.`
                : "Consulte o que os compradores comentaram sobre o atendimento, entrega e produtos desta vitrine."
            }
            avaliacoes={avaliacoes}
            contexto="loja"
            isLoading={isLoadingAvaliacoes}
            mensagemVazia="Esta loja ainda nao recebeu avaliacoes publicas."
            erro={erroAvaliacoes}
          />
        </div>
      </div>
    </PageLayout>
  );
}
