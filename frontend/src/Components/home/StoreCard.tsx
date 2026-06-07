import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useState } from "react";
import type { HomeStore } from "../../types/home";

type StoreCardProps = {
  loja: HomeStore;
};

type StarFill = "empty" | "half" | "full";

const STAR_POSITIONS = [
  { left: "12%", top: "36%", rotate: -34 },
  { left: "28%", top: "18%", rotate: -18 },
  { left: "50%", top: "10%", rotate: 0 },
  { left: "72%", top: "18%", rotate: 18 },
  { left: "88%", top: "36%", rotate: 34 },
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
    <span className="relative block h-3.5 w-3.5">
      <Star className="h-3.5 w-3.5 text-yellow-500/20" strokeWidth={1.8} />

      {fill !== "empty" ? (
        <span
          className={`absolute inset-0 overflow-hidden ${fill === "half" ? "w-1/2" : "w-full"}`}
        >
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" strokeWidth={1.8} />
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
    <span className="flex h-[5.25rem] w-[5.25rem] items-center justify-center overflow-hidden rounded-[1.75rem] border border-yellow-400/20 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.36),_rgba(23,23,23,0.96))] text-[1.35rem] font-bold tracking-[0.18em] text-yellow-50 shadow-[0_16px_32px_rgba(0,0,0,0.28)]">
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
    <div className="relative mx-auto h-28 w-full max-w-[132px]">
      <div className="absolute inset-x-0 top-3 mx-auto h-16 w-[6.8rem] rounded-[999px] border-t border-yellow-400/18" />

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
      <article className="group flex h-full min-h-[12.75rem] flex-col items-center rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,_rgba(255,255,255,0.045),_rgba(255,255,255,0.018))] px-3.5 py-4 text-center shadow-[0_18px_46px_rgba(0,0,0,0.3)] transition hover:-translate-y-1 hover:border-yellow-400/24">
        <StoreRatingArc
          nome={loja.nome}
          avatarUrl={loja.avatarUrl}
          mediaAvaliacao={loja.mediaAvaliacao}
        />

        <div className="mt-4 flex min-h-[3rem] items-start">
          <h3 className="line-clamp-2 text-[0.98rem] font-semibold leading-5 text-white">
            {loja.nome}
          </h3>
        </div>
      </article>
    </Link>
  );
}
