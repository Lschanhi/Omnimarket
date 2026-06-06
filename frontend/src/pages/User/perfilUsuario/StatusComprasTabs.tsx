import type {
  PerfilCompraStatusFiltroItem,
  PerfilFiltroStatusCompraId,
} from "../../../types/perfil";

type StatusComprasTabsProps = {
  filtros: PerfilCompraStatusFiltroItem[];
  filtroAtivo: PerfilFiltroStatusCompraId;
  isCarregando?: boolean;
  onChange: (filtro: PerfilFiltroStatusCompraId) => void;
};

export function StatusComprasTabs({
  filtros,
  filtroAtivo,
  isCarregando = false,
  onChange,
}: StatusComprasTabsProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {filtros.map((filtro) => {
          const isAtivo = filtro.key === filtroAtivo;

          return (
            <button
              key={filtro.key}
              type="button"
              onClick={() => onChange(filtro.key)}
              className={`rounded-full border px-4 py-2 text-left text-sm font-medium transition ${
                isAtivo
                  ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"
                  : "border-white/10 bg-black text-neutral-300 hover:border-white/20 hover:text-white"
              }`.trim()}
              title={filtro.descricao}
            >
              <span>{filtro.label}</span>
              <span className="ml-2 rounded-full border border-current/20 px-2 py-0.5 text-xs">
                {filtro.total}
              </span>
            </button>
          );
        })}
      </div>

      {isCarregando ? (
        <p className="text-xs text-neutral-500">
          Atualizando o status das solicitacoes de cancelamento e devolucao...
        </p>
      ) : null}
    </div>
  );
}
