import type { PerfilTabKey } from "../../types/perfil";

export interface UserTabOption {
  id: PerfilTabKey;
  label: string;
  disabled?: boolean;
}

// Renderiza a navegacao entre os blocos de conteudo do perfil.
interface UserTabsProps {
  abaAtiva: PerfilTabKey;
  tabs: UserTabOption[];
  onChange: (aba: PerfilTabKey) => void;
  withDivider?: boolean;
  className?: string;
}

export function UserTabs({
  abaAtiva,
  tabs,
  onChange,
  withDivider = true,
  className = "",
}: UserTabsProps) {
  return (
    <div
      className={`flex flex-wrap gap-3 ${withDivider ? "border-b border-white/10 pb-4" : ""} ${className}`.trim()}
    >
      {tabs.map((tab) => {
        const isAtiva = tab.id === abaAtiva;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            disabled={tab.disabled}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              isAtiva
                ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"
                : "border-white/10 bg-black text-neutral-400 hover:border-white/20 hover:text-white"
            } ${tab.disabled ? "cursor-not-allowed opacity-50" : ""}`.trim()}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
