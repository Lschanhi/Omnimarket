import type { ChangeEvent } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Botao } from "../../../Components/Botao";
import { ProfileModal } from "../../../Components/perfil/ProfileModal";

type ModalAvatarPerfilProps = {
  altPreviewAvatar: string;
  avatarErroAcao: string;
  avatarPreview: string;
  descricao: string;
  editandoFotoLoja: boolean;
  isOpen: boolean;
  isSalvandoAvatar: boolean;
  labelRemoverAvatar: string;
  labelSalvarAvatar: string;
  onClose: () => void;
  onRemoverAvatar: () => void;
  onSalvarAvatar: () => void;
  onSelecionarAvatar: (event: ChangeEvent<HTMLInputElement>) => void;
  titulo: string;
};

export function ModalAvatarPerfil({
  altPreviewAvatar,
  avatarErroAcao,
  avatarPreview,
  descricao,
  editandoFotoLoja,
  isOpen,
  isSalvandoAvatar,
  labelRemoverAvatar,
  labelSalvarAvatar,
  onClose,
  onRemoverAvatar,
  onSalvarAvatar,
  onSelecionarAvatar,
  titulo,
}: ModalAvatarPerfilProps) {
  return (
    <ProfileModal isOpen={isOpen} title={titulo} description={descricao} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-center">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt={altPreviewAvatar}
              className="h-32 w-32 rounded-full border-4 border-yellow-400 object-cover"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-dashed border-yellow-400/40 bg-black text-sm font-medium text-neutral-400">
              {editandoFotoLoja ? "Sem foto da loja" : "Sem foto"}
            </div>
          )}

          <label className="w-full cursor-pointer rounded-2xl border border-dashed border-yellow-400/30 bg-yellow-400/10 px-4 py-5 text-sm text-yellow-100 transition hover:border-yellow-400/50 hover:bg-yellow-400/15">
            <div className="flex flex-col items-center gap-3">
              <ImagePlus className="h-6 w-6" />
              <div className="space-y-1">
                <p className="font-medium text-white">
                  {editandoFotoLoja ? "Selecionar imagem da loja" : "Selecionar imagem"}
                </p>
                <p className="text-xs text-neutral-300">PNG, JPG ou WebP com ate 2 MB</p>
              </div>
            </div>

            <input type="file" accept="image/*" className="hidden" onChange={onSelecionarAvatar} />
          </label>
        </div>

        {avatarErroAcao ? <p className="text-sm text-red-400">{avatarErroAcao}</p> : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Botao
              type="button"
              variant="secondary"
              onClick={onClose}
              className="h-11 sm:w-auto sm:px-6"
            >
              Cancelar
            </Botao>

            <Botao
              type="button"
              variant="secondary"
              onClick={onRemoverAvatar}
              className="h-11 border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/20 sm:w-auto sm:px-6"
              icon={<Trash2 className="h-4 w-4" />}
            >
              {labelRemoverAvatar}
            </Botao>
          </div>

          <Botao
            type="button"
            disabled={isSalvandoAvatar}
            onClick={onSalvarAvatar}
            className="h-11 sm:w-auto sm:px-6"
          >
            {isSalvandoAvatar ? "Salvando..." : labelSalvarAvatar}
          </Botao>
        </div>
      </div>
    </ProfileModal>
  );
}
