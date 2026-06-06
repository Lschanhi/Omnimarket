import { useState } from "react";

type StoreIdentityBadgeProps = {
  nome?: string;
  avatarUrl?: string;
  compact?: boolean;
  className?: string;
};

function obterIniciaisLoja(nome: string) {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (partes.length === 0) {
    return "OM";
  }

  return partes.map((parte) => parte[0]?.toUpperCase() ?? "").join("") || "OM";
}

export function StoreIdentityBadge({
  nome = "Loja OmniMarket",
  avatarUrl,
  compact = false,
  className = "",
}: StoreIdentityBadgeProps) {
  const iniciais = obterIniciaisLoja(nome);
  const avatarTamanho = compact ? "h-8 w-8 text-[0.65rem]" : "h-11 w-11 text-sm";
  const [estadoAvatar, setEstadoAvatar] = useState({ url: "", erro: false });
  const avatarComErro = estadoAvatar.url === (avatarUrl ?? "") && estadoAvatar.erro;

  return (
    <div
      className={`inline-flex max-w-full items-center gap-3 rounded-full border border-yellow-400/30 bg-black/70 px-3 py-2 text-left text-yellow-100 backdrop-blur-md ${className}`.trim()}
    >
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-yellow-400/30 bg-[linear-gradient(135deg,_rgba(250,204,21,0.32),_rgba(17,24,39,0.92))] font-bold tracking-[0.18em] text-yellow-50 ${avatarTamanho}`}
      >
        {avatarUrl && !avatarComErro ? (
          <img
            src={avatarUrl}
            alt={`Foto de perfil da loja ${nome}`}
            className="h-full w-full object-cover"
            onError={() => {
              setEstadoAvatar({
                url: avatarUrl ?? "",
                erro: true,
              });
            }}
          />
        ) : (
          iniciais
        )}
      </span>

      <span className="min-w-0">
        <span className="block text-[0.65rem] uppercase tracking-[0.22em] text-yellow-200/70">
          Loja
        </span>
        <span className="block truncate text-sm font-semibold text-white">{nome}</span>
      </span>
    </div>
  );
}
