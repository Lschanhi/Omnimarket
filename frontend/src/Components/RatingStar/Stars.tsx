import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import type { IconType } from "react-icons";

type StarsProps = {
  nota?: number;
  className?: string;
  mostrarNota?: boolean;
  tamanho?: "sm" | "md" | "lg";
};

const tamanhoClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export default function Stars({
  nota = 0,
  className = "",
  mostrarNota = true,
  tamanho = "md",
}: StarsProps) {
  const notaSegura = Math.min(5, Math.max(0, Number.isFinite(nota) ? nota : 0));
  const estrelas: IconType[] = [];

  for (let i = 1; i <= 5; i++) {
    if (notaSegura >= i) {
      estrelas.push(FaStar);
    } else if (notaSegura >= i - 0.5) {
      estrelas.push(FaStarHalfAlt);
    } else {
      estrelas.push(FaRegStar);
    }
  }

  return (
    <div
      className={`inline-flex max-w-full min-w-0 items-center gap-2 ${className}`}
      aria-label={`Avaliacao ${notaSegura.toFixed(1)} de 5`}
      title={`Avaliacao ${notaSegura.toFixed(1)} de 5`}
    >
      <div className="flex shrink-0 gap-1 text-yellow-400">
        {estrelas.map((Icone, index) => (
          <Icone key={index} className={`${tamanhoClasses[tamanho]} shrink-0`} aria-hidden="true" />
        ))}
      </div>

      {mostrarNota ? (
        <span className="min-w-0 truncate whitespace-nowrap text-sm font-medium text-neutral-300">
          {notaSegura.toFixed(1)}
        </span>
      ) : null}
    </div>
  );
}

