import { useEffect, useState } from "react";
import { ArrowDownWideNarrow } from "lucide-react";
import { Banner } from "../../Components/home/Banner";
import { CategoryList } from "../../Components/home/CategoryList";
import { ProductGrid } from "../../Components/home/ProductGrid";
import { SearchBar } from "../../Components/home/SearchBar";
import { Spotlight } from "../../Components/home/SpotLight";
import { PageLayout } from "../../Components/PageLayout";
import { createMockImage } from "../../data/produtos";
import { listarProdutos } from "../../Services/produtos/produtoService";
import type { HomeCategory, HomeProduct } from "../../types/home";

function resolverIconeCategoria(categoria: string): HomeCategory["icone"] {
  const normalizedCategory = categoria
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalizedCategory.includes("roupa") || normalizedCategory.includes("moda")) {
    return "shirt";
  }

  if (normalizedCategory.includes("game")) {
    return "gamepad";
  }

  if (normalizedCategory.includes("casa") || normalizedCategory.includes("movel")) {
    return "sofa";
  }

  if (normalizedCategory.includes("audio") || normalizedCategory.includes("fone")) {
    return "headphones";
  }

  if (
    normalizedCategory.includes("acessorio") ||
    normalizedCategory.includes("relogio")
  ) {
    return "watch";
  }

  return "smartphone";
}

export function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [loadError, setLoadError] = useState("");
  const visibleCount = 6;

  useEffect(() => {
    let isMounted = true;

    async function carregarProdutos() {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await listarProdutos();

        if (isMounted) {
          setProducts(response.filter((produto) => produto.disponivel !== false));
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Nao foi possivel carregar o catalogo.";
        setLoadError(message);
        setProducts([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void carregarProdutos();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories: HomeCategory[] = [
    { id: "todos", nome: "Todos", icone: "smartphone" },
    ...products
      .reduce<HomeCategory[]>((accumulator, product) => {
        const hasCategory = accumulator.some(
          (category) => category.id === product.categoriaId,
        );

        if (!hasCategory) {
          accumulator.push({
            id: product.categoriaId,
            nome: product.categoriaNome,
            icone: resolverIconeCategoria(product.categoriaNome),
          });
        }

        return accumulator;
      }, [])
      .sort((firstCategory, secondCategory) =>
        firstCategory.nome.localeCompare(secondCategory.nome),
      ),
  ];

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "todos" || product.categoriaId === selectedCategory;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      product.nome.toLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });
  const activeCategoryName =
    categories.find((categoria) => categoria.id === selectedCategory)?.nome ?? "Todos";

  return (
    <PageLayout>
      <div className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <Spotlight>
            <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.16),_transparent_48%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
              <div className="flex flex-col gap-6">
                <div className="space-y-3">
                  {/* <span className="inline-flex w-fit rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1 text-sm font-medium text-yellow-300">
                    Marketplace conectado
                  </span> */}
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-yellow-400 sm:text-5xl text-center ">
                      Bem-vindo ao Omnimarket
                    </h1>
                    <p className=" text-lg text-white font-bold text-center">
                      Aqui você encontrará tudo que deseja em um só lugar
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
                titulo="Semana OmniMarket com descontos em tecnologia, moda e casa"
                descricao="Use esta seção para destacar campanhas sazonais, vitrines patrocinadas ou produtos líderes de conversão quando a API estiver conectada."
                imagem={createMockImage("Semana OmniMarket", "#eab308", "#111827")}
              />
            </div>
          </Spotlight>

          <CategoryList
            categorias={categories}
            categoriaAtiva={selectedCategory}
            onSelect={setSelectedCategory}
          />

          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">Produtos em destaque</h2>
                <p className="text-sm text-neutral-400">
                  A listagem abaixo já vem da API e continua pronta para receber
                  filtros do back-end e proximas evoluções de paginação.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300">
                <ArrowDownWideNarrow className="h-4 w-4 text-yellow-400" />
                Ordenação: mais relevantes
              </div>
            </div>

            {loadError ? (
              <div className="rounded-[28px] border border-red-400/20 bg-red-500/5 px-5 py-4 text-sm text-red-200">
                {loadError}
              </div>
            ) : null}

            <ProductGrid
              produtos={filteredProducts}
              isLoading={isLoading}
              termoBusca={searchTerm}
              categoriaAtivaNome={activeCategoryName}
              visibleCount={visibleCount}
            />
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
