import type { PerfilFiltroStatusVendaId, PerfilVendaStatusFiltroItem } from "../../../types/perfil";

type StatusVendasTabsProps = {
  filtros: PerfilVendaStatusFiltroItem[];
  filtroAtivo: PerfilFiltroStatusVendaId;
  onChange: (filtro: PerfilFiltroStatusVendaId) => void;
};

export function StatusVendasTabs({
  filtros,
  filtroAtivo,
  onChange,
}: StatusVendasTabsProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">Status da venda</p>
        <p className="text-sm text-neutral-400">
          Clique em uma etapa para ver os pedidos daquela fase e gerenciar o proximo passo.
        </p>
      </div>

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
            >
              <span>{filtro.label}</span>
              <span className="ml-2 rounded-full border border-current/20 px-2 py-0.5 text-xs">
                {filtro.total}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
