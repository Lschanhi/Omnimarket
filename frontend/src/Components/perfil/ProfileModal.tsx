import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export function ProfileModal({
  isOpen,
  title,
  description,
  onClose,
  children,
}: ProfileModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.6)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
            {description ? <p className="text-sm text-neutral-400">{description}</p> : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-neutral-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
