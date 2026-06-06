import { useMemo, useState } from "react";
import { criarImagemPlaceholder } from "../../Services/produtos/produtoService";

type ProdutoImagemProps = {
  alt: string;
  src?: string;
  sources?: string[];
  placeholderLabel: string;
  className?: string;
};

function normalizarFontes(src?: string, sources?: string[]) {
  const candidatos = [src, ...(sources ?? [])].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );

  return Array.from(new Set(candidatos));
}

export function ProdutoImagem({
  alt,
  src,
  sources,
  placeholderLabel,
  className,
}: ProdutoImagemProps) {
  const fontes = useMemo(() => normalizarFontes(src, sources), [src, sources]);
  const fontesKey = useMemo(() => fontes.join("|"), [fontes]);
  const [estadoFonte, setEstadoFonte] = useState({ key: "", index: 0 });
  const indiceFonte = estadoFonte.key === fontesKey ? estadoFonte.index : 0;

  const placeholder = criarImagemPlaceholder(placeholderLabel);
  const imagemAtual = fontes[indiceFonte] ?? placeholder;

  return (
    <img
      src={imagemAtual}
      alt={alt}
      onError={() => {
        setEstadoFonte((currentState) => {
          const currentIndex = currentState.key === fontesKey ? currentState.index : 0;

          if (currentIndex < fontes.length - 1) {
            return {
              key: fontesKey,
              index: currentIndex + 1,
            };
          }

          return {
            key: fontesKey,
            index: fontes.length,
          };
        });
      }}
      className={className}
    />
  );
}
