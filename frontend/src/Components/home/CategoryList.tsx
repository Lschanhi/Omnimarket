import {
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Headphones,
  Shirt,
  Smartphone,
  Sofa,
  Watch,
} from "lucide-react";
import type { HomeCategory } from "../../types/home";
import { useEffect, useRef, useState } from "react";

// Define os dados de controle da lista horizontal de categorias.
type CategoryListProps = {
  categorias: HomeCategory[];
  categoriaAtiva: string;
  onSelect: (categoriaId: string) => void;
};

// Mapeia o nome do icone informado nos mocks para o componente visual correspondente.
const iconMap = {
  smartphone: Smartphone,
  shirt: Shirt,
  gamepad: Gamepad2,
  sofa: Sofa,
  headphones: Headphones,
  watch: Watch,
};

// Renderiza a faixa horizontal de categorias, preparada para scroll em telas menores.
export function CategoryList({
  categorias,
  categoriaAtiva,
  onSelect,
}: CategoryListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [mostrarEsquerda, setMostrarEsquerda] = useState(false);
  const [mostrarDireita, setMostrarDireita] = useState(false);

  function atualizarBotoes() {
    const container = scrollRef.current;

    if (!container) return;

    setMostrarEsquerda(container.scrollLeft > 0);

    setMostrarDireita(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1,
    );
  }

  function scrollParaEsquerda() {
    scrollRef.current?.scrollBy({
      left: -300,
      behavior: "smooth",
    });
  }

  function scrollParaDireita() {
    scrollRef.current?.scrollBy({
      left: 300,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    atualizarBotoes();

    window.addEventListener("resize", atualizarBotoes);

    return () => {
      window.removeEventListener("resize", atualizarBotoes);
    };
  }, [categorias]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            Categorias
          </h2>
          <p className="text-sm text-neutral-400">
            Navegue por coleções como em um marketplace real.
          </p>
        </div>
      </div>

      {/* O container horizontal usa overflow para manter a UX fluida no mobile. */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={scrollParaEsquerda}
          disabled={!mostrarEsquerda}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>

        <div
          ref={scrollRef}
          onScroll={atualizarBotoes}
          className="flex flex-1 gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categorias.map((categoria) => {
            const Icone = iconMap[categoria.icone];
            const isAtiva = categoriaAtiva === categoria.id;

            return (
              <button
                key={categoria.id}
                type="button"
                onClick={() => onSelect(categoria.id)}
                className={`flex shrink-0 items-center gap-3 rounded-[24px] border px-4 py-4 text-left transition ${
                  isAtiva
                    ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-300"
                    : "border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    isAtiva ? "bg-yellow-400/15" : "bg-black/40"
                  }`}
                >
                  <Icone className="h-5 w-5" />
                </span>

                <span className="text-sm font-medium">{categoria.nome}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={scrollParaDireita}
          disabled={!mostrarDireita}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10 disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5 text-white" />
        </button>
      </div>
    </section>
  );
}
