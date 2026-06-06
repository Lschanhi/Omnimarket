import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Botao } from "../../Components/Botao";
import { PageLayout } from "../../Components/PageLayout";
import { ProdutoImagem } from "../../Components/produto/ProdutoImagem";
import { StoreIdentityBadge } from "../../Components/produto/StoreIdentityBadge";
import { useCart } from "../../context/CartContext";
import { registrarVisualizacaoProduto } from "../../Services/home/homeHistoryService";
import { obterProdutoPorId } from "../../Services/produtos/produtoService";
import type { HomeProduct } from "../../types/home";

export function ProdutoPage() {
  const { id } = useParams({ strict: false });
  const navigate = useNavigate();
  const { adicionarAoCarrinho } = useCart();
  const [produto, setProduto] = useState<HomeProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let isMounted = true;
    const produtoId = Number(id);

    if (!Number.isFinite(produtoId) || produtoId <= 0) {
      setErro("Produto invalido.");
      setIsLoading(false);
      return;
    }

    async function carregarProduto() {
      setIsLoading(true);
      setErro("");

      try {
        const response = await obterProdutoPorId(produtoId, {
          registrarVisualizacao: true,
        });

        if (isMounted) {
          if (response.disponivel === false) {
            setProduto(null);
            setErro("Este produto não esta mais disponivel na vitrine.");
            return;
          }

          setProduto(response);
          registrarVisualizacaoProduto(response);
          setErro("");
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Não foi possivel carregar o produto.";
        setErro(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void carregarProduto();

    return () => {
      isMounted = false;
    };
  }, [id]);

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
        error instanceof Error ? error.message : "Não foi possível adicionar o produto.";
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
              Produto não encontrado
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
                    <StoreIdentityBadge
                      nome={produto.lojaNome ?? "Detalhes do produto"}
                      avatarUrl={produto.lojaAvatarUrl}
                    />

                    <div className="space-y-3">
                      <h1 className="w-full break-words text-left text-[clamp(2rem,4vw,4rem)] font-bold leading-[1.05] tracking-tight text-white">
                        {produto.nome}
                      </h1>

                      <p className="text-sm text-neutral-400 sm:text-base">
                        Código do produto:{" "}
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
                      Preço
                    </p>

                    <p className="mt-2 text-[clamp(2rem,4vw,3.5rem)] font-bold leading-none text-yellow-400">
                      {produto.preco.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>

                    <p className="mt-4 text-sm text-neutral-300">
                      Avaliação media:{" "}
                      <span className="font-semibold text-white">
                        {produto.avaliacao.toFixed(1)} / 5
                      </span>
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
        </div>
      </div>
    </PageLayout>
  );
}
