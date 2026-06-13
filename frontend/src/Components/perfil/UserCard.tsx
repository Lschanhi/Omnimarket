import type { ReactNode } from "react";
import type { PerfilIdentityCardData } from "../../types/perfil";
import { Botao } from "../Botao";
import { ProfileSection } from "./ProfileSection";
import { UserInfo } from "./UserInfo";
import { Camera } from "lucide-react";

interface UserCardAction {
  label: string;
  onClick: () => void;
  icon: ReactNode;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

// Exibe o resumo principal do contexto ativo do perfil com avatar, nome e contatos.
interface UserCardProps {
  card: PerfilIdentityCardData | null;
  onEditAvatar: () => void;
  primaryAction: UserCardAction;
  secondaryAction?: UserCardAction;
  tertiaryAction?: UserCardAction;
}

// Gera as iniciais para quando a foto real ainda nao estiver disponivel.
function obterIniciais(nome: string | undefined) {
  if (!nome) {
    return "U";
  }

  const partesDoNome = nome.trim().split(" ").filter(Boolean);
  const primeiraParte = partesDoNome[0]?.[0] ?? "";
  const ultimaParte = partesDoNome[1]?.[0] ?? "";

  return `${primeiraParte}${ultimaParte}`.toUpperCase();
}

export function UserCard({
  card,
  onEditAvatar,
  primaryAction,
  secondaryAction,
  tertiaryAction,
}: UserCardProps) {
  const descricaoFoto = card?.rotulo ? `Alterar foto de ${card.rotulo.toLowerCase()}` : "Alterar foto";
  const actions = [primaryAction, secondaryAction, tertiaryAction].filter(
    Boolean,
  ) as UserCardAction[];

  return (
    <ProfileSection className="h-full">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <button
            type="button"
            onClick={onEditAvatar}
            className="group relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70"
            aria-label={descricaoFoto}
          >
            {card?.avatarUrl ? (
              <img
                src={card.avatarUrl}
                alt={`Imagem de ${card.nome}`}
                className="h-54 w-40 rounded-full border-4 border-yellow-400 object-cover transition group-hover:brightness-75 sm:h-54 sm:w-60"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-yellow-400 bg-black text-3xl font-bold text-yellow-400 transition group-hover:bg-neutral-950 sm:h-32 sm:w-32">
                {obterIniciais(card?.nome)}
              </div>
            )}

            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition group-hover:opacity-100">
              <Camera className="h-5 w-5" />
            </span>
          </button>

          <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
            {card?.fotoHint || "Clique na foto para alterar"}
          </p>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.32em] text-yellow-400">
              {card?.rotulo || "Perfil"}
            </p>
            <h1 className="text-2xl font-semibold text-white">
              {card?.nome || "Informacao indisponivel"}
            </h1>
            <p className="text-sm text-neutral-400">
              {card?.resumo || "Area pronta para bio, cargo ou descricao curta."}
            </p>
          </div>

          {card?.badge ? (
            <div className="inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-yellow-300">
              {card.badge}
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/10" />

        <UserInfo items={card?.infoItems ?? []} />

        <div className="rounded-2xl border border-dashed border-yellow-400/25 bg-yellow-400/5 px-4 py-4">
          <div
            className={`grid gap-3 ${
              actions.length >= 3 ? "sm:grid-cols-3" : actions.length === 2 ? "sm:grid-cols-2" : ""
            }`.trim()}
          >
            {actions.map((action) => (
              <Botao
                key={action.label}
                onClick={action.onClick}
                disabled={action.disabled}
                variant={action.variant === "primary" ? "primary" : "secondary"}
                className={`h-11 text-sm ${
                  action.variant === "primary"
                    ? ""
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`.trim()}
                icon={action.icon}
              >
                {action.label}
              </Botao>
            ))}
          </div>

          <p className="mt-3 text-sm text-neutral-400">
            {card?.footerText || "Use este painel para revisar os dados principais da conta."}
          </p>
        </div>
      </div>
    </ProfileSection>
  );
}
