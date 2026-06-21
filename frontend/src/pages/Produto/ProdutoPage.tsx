import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AvaliacaoFeed } from "../../Components/AvaliacaoFeed";
import { Botao } from "../../Components/Botao";
import { PageLayout } from "../../Components/PageLayout";
import { ProdutoImagem } from "../../Components/produto/ProdutoImagem";
import { StoreIdentityBadge } from "../../Components/produto/StoreIdentityBadge";
import { useCart } from "../../context/CartContext";
import { useCatalogoAutoRefresh } from "../../hooks/useCatalogoAutoRefresh";
import { registrarVisualizacaoProduto } from "../../Services/home/homeHistoryService";
import { listarAvaliacoesProduto } from "../../Services/produtos/avaliacaoService";
import { obterProdutoPorId } from "../../Services/produtos/produtoService";
import type { ProdutoAvaliacaoLeitura } from "../../types/avaliacao";
import type { HomeProduct } from "../../types/home";

export function ProdutoPage() {
  const { id } = useParams({ strict: false });
  const produtoId = Number(id);
  const produtoIdValido = Number.isFinite(produtoId) && produtoId > 0;
  const navigate = useNavigate();
  const { adicionarAoCarrinho } = useCart();
  const [produto, setProduto] = useState<HomeProduct | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<ProdutoAvaliacaoLeitura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAvaliacoes, setIsLoadingAvaliacoes] = useState(true);
  const [erro, setErro] = useState("");
  const [erroAvaliacoes, setErroAvaliacoes] = useState("");
  const [reloadSeed, setReloadSeed] = useState(0);

  useEffect(() => {
    let isMounted = true;

    if (!produtoIdValido) {
      setErro("Produto invalido.");
      setIsLoading(false);
      setIsLoadingAvaliacoes(false);
      return;
    }

    async function carregarProduto() {
      setIsLoading(true);
      setIsLoadingAvaliacoes(true);
      setErro("");
      setErroAvaliacoes("");

      try {
        const [produtoResultado, avaliacoesResultado] = await Promise.allSettled([
          obterProdutoPorId(produtoId, {
            registrarVisualizacao: true,
          }),
          listarAvaliacoesProduto(produtoId, { pageSize: 12 }),
        ]);

        if (produtoResultado.status === "rejected") {
          throw produtoResultado.reason;
        }

        if (!isMounted) {
          return;
        }

        const response = produtoResultado.value;

        if (response.disponivel === false) {
          setProduto(null);
          setErro("Este produto nao esta mais disponivel na vitrine.");
          return;
        }

        setProduto(response);
        registrarVisualizacaoProduto(response);
        setErro("");

        if (avaliacoesResultado.status === "fulfilled") {
          setAvaliacoes(avaliacoesResultado.value.items);
        } else {
          setAvaliacoes([]);
          setErroAvaliacoes(
            avaliacoesResultado.reason instanceof Error
              ? avaliacoesResultado.reason.message
              : "Nao foi possivel carregar as avaliacoes deste produto.",
          );
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Nao foi possivel carregar o produto.";
        setErro(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsLoadingAvaliacoes(false);
        }
      }
    }

    void carregarProduto();

    return () => {
      isMounted = false;
    };
  }, [id, produtoId, produtoIdValido, reloadSeed]);

  useCatalogoAutoRefresh({
    enabled: produtoIdValido,
    intervalMs: 15000,
    onRefresh: () => setReloadSeed((currentSeed) => currentSeed + 1),
  });

  async function handleAdicionarAoCarrinho(irParaCheckout: boolean) {
    if (!produto) {
      return;
    }

    try {
      await adicionarAoCarrinho(produto.id);

      if (irParaCheckout) {
        navigate({ to: "/paginaPagamento" });
        return;
      }

      alert("Produto adicionado ao carrinho com sucesso!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel adicionar o produto.";
      alert(message);

      if (message.toLowerCase().includes("login")) {
        navigate({ to: "/login" });
      }
    }
  }

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center px-4 py-10 text-white">
          <p className="text-sm uppercase tracking-[0.24em] text-neutral-400">
            Carregando produto...
          </p>
        </div>
      </PageLayout>
    );
  }

  if (!produto || erro) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <section className="w-full max-w-xl rounded-[28px] border border-yellow-400/20 bg-white/5 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
            <span className="inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1 text-sm font-medium text-yellow-300">
              Produto indisponivel
            </span>

            <h1 className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight text-white">
              Produto nao encontrado
            </h1>

            <p className="mt-3 text-sm leading-6 text-neutral-300 sm:text-base">
              {erro ||
                "O item solicitado nao foi localizado. Verifique se o link esta correto ou retorne para a listagem para selecionar outro produto."}
            </p>
          </section>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.02))] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.12),_transparent_45%),linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0.01))] lg:min-h-[36rem] lg:border-b-0 lg:border-r">
                <ProdutoImagem
                  src={produto.imagem}
                  sources={produto.imagens}
                  alt={produto.nome}
                  placeholderLabel={produto.nome}
                  className="block h-full w-full rounded-2xl object-contain"
                />
              </div>

              <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        navigate({
                          to: "/loja/$id",
                          params: {
                            id: String(produto.lojaId),
                          },
                        });
                      }}
                    >
                      <StoreIdentityBadge
                        nome={produto.lojaNome ?? "Detalhes do produto"}
                        avatarUrl={produto.lojaAvatarUrl}
                      />
                    </div>

                    <div className="space-y-3">
                      <h1 className="w-full break-words text-left text-[clamp(2rem,4vw,4rem)] font-bold leading-[1.05] tracking-tight text-white">
                        {produto.nome}
                      </h1>

                      <p className="text-sm text-neutral-400 sm:text-base">
                        Codigo do produto:{" "}
                        <span className="font-medium text-neutral-200">{produto.id}</span>
                      </p>

                      {produto.descricao ? (
                        <p className="max-w-2xl text-sm leading-7 text-neutral-300 sm:text-base">
                          {produto.descricao}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5 sm:p-6">
                    <p className="text-sm uppercase tracking-[0.24em] text-yellow-200/80">
                      Preco
                    </p>

                    <p className="mt-2 text-[clamp(2rem,4vw,3.5rem)] font-bold leading-none text-yellow-400">
                      {produto.preco.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>

                    <p className="mt-4 text-sm text-neutral-300">
                      Avaliacao media:{" "}
                      <span className="font-semibold text-white">
                        {produto.avaliacao.toFixed(1)} / 5
                      </span>
                    </p>

                    <p className="mt-2 text-sm text-neutral-400">
                      {produto.totalAvaliacoes ?? avaliacoes.length} avaliacao(oes) publicadas.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex-1">
                      <Botao
                        className="h-14 w-full text-base font-semibold sm:text-lg"
                        onClick={() => {
                          void handleAdicionarAoCarrinho(true);
                        }}
                      >
                        Comprar
                      </Botao>
                    </div>

                    <div className="flex-1">
                      <Botao
                        icon={<ShoppingCart className="h-5 w-5" />}
                        variant="secondary"
                        className="h-14 w-full text-base font-semibold sm:text-lg"
                        onClick={() => {
                          void handleAdicionarAoCarrinho(false);
                        }}
                      >
                        Adicionar ao carrinho
                      </Botao>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <AvaliacaoFeed
            titulo="Avaliacoes de compradores"
            descricao={
              produto.totalAvaliacoes && produto.totalAvaliacoes > avaliacoes.length
                ? `Mostrando as avaliacoes mais recentes. O produto soma ${produto.totalAvaliacoes} registro(s) no total.`
                : "Veja como outros compradores avaliaram o produto e a experiencia com a loja."
            }
            avaliacoes={avaliacoes}
            contexto="produto"
            isLoading={isLoadingAvaliacoes}
            mensagemVazia="Este produto ainda nao recebeu avaliacoes publicas."
            erro={erroAvaliacoes}
          />
        </div>
      </div>
    </PageLayout>
  );
}
