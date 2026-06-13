import type { PerfilStatCardItem } from "../../types/perfil";
import { ProfileSection } from "./ProfileSection";

// Exibe os principais indicadores do contexto ativo em um grid responsivo.
interface UserStatsProps {
  title: string;
  description: string;
  stats: PerfilStatCardItem[];
}

export function UserStats({ title, description, stats }: UserStatsProps) {
  const gridColumnsClass =
    stats.length >= 5
      ? "xl:grid-cols-5"
      : stats.length === 4
        ? "xl:grid-cols-4"
        : stats.length === 3
          ? "xl:grid-cols-3"
          : stats.length === 2
            ? "xl:grid-cols-2"
            : "xl:grid-cols-1";

  return (
    <ProfileSection title={title} description={description}>
      <div className={`grid gap-3 sm:grid-cols-2 ${gridColumnsClass}`}>
        {stats.map(({ key, label, value }) => (
          <div
            key={key}
            className="rounded-2xl border border-white/8 bg-black/45 px-4 py-4"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">{label}</p>
            <p className="mt-3 text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>
    </ProfileSection>
  );
}
