import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useState } from "react";
import type { HomeStore } from "../../types/home";

type StoreCardProps = {
  loja: HomeStore;
};

type StarFill = "empty" | "half" | "full";

const STAR_POSITIONS = [
  { left: "14%", top: "32%", rotate: -34 },
  { left: "28%", top: "13%", rotate: -18 },
  { left: "50%", top: "4%", rotate: 0 },
  { left: "72%", top: "13%", rotate: 18 },
  { left: "86%", top: "32%", rotate: 34 },
] as const;

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

function calcularPreenchimentoEstrela(nota: number, indice: number): StarFill {
  const diferenca = nota - indice;

  if (diferenca >= 1) {
    return "full";
  }

  if (diferenca >= 0.5) {
    return "half";
  }

  return "empty";
}

function StarGlyph({ fill }: { fill: StarFill }) {
  return (
    <span className="relative block h-4 w-4">
      <Star className="h-4 w-4 text-yellow-500/20" strokeWidth={1.8} />

      {fill !== "empty" ? (
        <span
          className={`absolute inset-0 overflow-hidden ${fill === "half" ? "w-1/2" : "w-full"}`}
        >
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" strokeWidth={1.8} />
        </span>
      ) : null}
    </span>
  );
}

function StoreAvatar({ nome, avatarUrl }: { nome: string; avatarUrl?: string }) {
  const [estadoAvatar, setEstadoAvatar] = useState({ url: "", erro: false });
  const avatarComErro = estadoAvatar.url === (avatarUrl ?? "") && estadoAvatar.erro;
  const iniciais = obterIniciaisLoja(nome);

  return (
    <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[30px] border border-yellow-400/25 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.38),_rgba(23,23,23,0.94))] text-2xl font-bold tracking-[0.2em] text-yellow-50 shadow-[0_18px_42px_rgba(0,0,0,0.35)]">
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
  );
}

function StoreRatingArc({
  nome,
  avatarUrl,
  mediaAvaliacao,
}: {
  nome: string;
  avatarUrl?: string;
  mediaAvaliacao: number;
}) {
  const notaNormalizada = Math.round(Math.max(0, Math.min(5, mediaAvaliacao)) * 2) / 2;

  return (
    <div className="relative mx-auto h-32 w-full max-w-[136px]">
      <div className="absolute inset-x-0 top-4 mx-auto h-16 w-28 rounded-[999px] border-t border-yellow-400/20" />

      {STAR_POSITIONS.map((position, indice) => (
        <span
          key={`${nome}-star-${indice}`}
          className="absolute"
          style={{
            left: position.left,
            top: position.top,
            transform: `translate(-50%, -50%) rotate(${position.rotate}deg)`,
          }}
        >
          <StarGlyph fill={calcularPreenchimentoEstrela(notaNormalizada, indice)} />
        </span>
      ))}

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <StoreAvatar nome={nome} avatarUrl={avatarUrl} />
      </div>
    </div>
  );
}

export function StoreCard({ loja }: StoreCardProps) {
  return (
    <Link
      to="/loja/$id"
      params={{ id: String(loja.id) }}
      aria-label={`${loja.nome} com avaliacao media ${loja.mediaAvaliacao.toFixed(1)} de 5`}
    >
      <article className="group flex h-full min-h-[220px] flex-col items-center rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.02))] px-4 py-5 text-center shadow-[0_18px_50px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:border-yellow-400/30">
        <StoreRatingArc
          nome={loja.nome}
          avatarUrl={loja.avatarUrl}
          mediaAvaliacao={loja.mediaAvaliacao}
        />

        <div className="mt-3">
          <h3 className="line-clamp-2 min-h-[3rem] text-base font-semibold leading-6 text-white">
            {loja.nome}
          </h3>
        </div>
      </article>
    </Link>
  );
}
