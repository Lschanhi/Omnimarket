import type { ChangeEvent, FormEvent } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Botao } from "../../../Components/Botao";
import { Input } from "../../../Components/Input";
import { ProfileModal } from "../../../Components/perfil/ProfileModal";
import type { ProdutoFormState } from "./tipos";

type ModalProdutoLojaProps = {
  descricao: string;
  isOpen: boolean;
  isProcessandoProduto: boolean;
  isRemovendoProduto: boolean;
  isSalvandoProduto: boolean;
  onChangeProdutoInput: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onClose: () => void;
  onConfirmarRemocaoProdutoAtual: () => void;
  onRemoverImagemProduto: () => void;
  onSelecionarImagemProduto: (event: ChangeEvent<HTMLInputElement>) => void;
  onSolicitarRemocaoProdutoAtual: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleProdutoDisponivel: (event: ChangeEvent<HTMLInputElement>) => void;
  produtoConfirmandoExclusao: boolean;
  produtoErroAcao: string;
  produtoForm: ProdutoFormState;
  titulo: string;
  voltarConfirmacaoExclusao: () => void;
};

export function ModalProdutoLoja({
  descricao,
  isOpen,
  isProcessandoProduto,
  isRemovendoProduto,
  isSalvandoProduto,
  onChangeProdutoInput,
  onClose,
  onConfirmarRemocaoProdutoAtual,
  onRemoverImagemProduto,
  onSelecionarImagemProduto,
  onSolicitarRemocaoProdutoAtual,
  onSubmit,
  onToggleProdutoDisponivel,
  produtoConfirmandoExclusao,
  produtoErroAcao,
  produtoForm,
  titulo,
  voltarConfirmacaoExclusao,
}: ModalProdutoLojaProps) {
  return (
    <ProfileModal isOpen={isOpen} title={titulo} description={descricao} onClose={onClose}>
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nome do produto"
            id="produtoNome"
            name="nome"
            placeholder="Mouse Gamer RGB"
            value={produtoForm.nome}
            onChange={onChangeProdutoInput}
            required
          />

          <Input
            label="Categoria"
            id="produtoCategoria"
            name="categoria"
            placeholder="Perifericos"
            value={produtoForm.categoria}
            onChange={onChangeProdutoInput}
            required
          />

          <Input
            label="Preco"
            id="produtoPreco"
            name="preco"
            inputMode="decimal"
            placeholder="100,99"
            value={produtoForm.preco}
            onChange={onChangeProdutoInput}
            required
          />

          <Input
            label="Estoque"
            id="produtoEstoque"
            name="estoque"
            type="number"
            min="0"
            placeholder="10"
            value={produtoForm.estoque}
            onChange={onChangeProdutoInput}
            required
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">Imagem principal</p>
              <p className="text-xs text-neutral-400">
                Envie uma foto do produto em PNG, JPG ou WebP com até 2 MB.
              </p>
            </div>

            {produtoForm.imagemUrl ? (
              <button
                type="button"
                onClick={onRemoverImagemProduto}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10 text-red-300 transition hover:border-red-400/40 hover:bg-red-400/20"
                aria-label="Remover imagem do produto"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
            <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              {produtoForm.imagemUrl ? (
                <img
                  src={produtoForm.imagemUrl}
                  alt={`Preview do produto ${produtoForm.nome || "selecionado"}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="px-4 text-center text-xs uppercase tracking-[0.22em] text-neutral-500">
                  Sem imagem
                </span>
              )}
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-yellow-400/30 bg-yellow-400/10 px-4 py-6 text-center text-sm text-yellow-100 transition hover:border-yellow-400/50 hover:bg-yellow-400/15">
              <ImagePlus className="h-6 w-6" />
              <div className="space-y-1">
                <p className="font-medium text-white">Selecionar foto do produto</p>
                <p className="text-xs text-neutral-300">
                  O arquivo escolhido já será usado no cadastro.
                </p>
              </div>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onSelecionarImagemProduto}
              />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="produtoDescricao" className="text-[#6b6b6b]">
            Descricao
          </label>
          <textarea
            id="produtoDescricao"
            name="descricao"
            value={produtoForm.descricao}
            onChange={onChangeProdutoInput}
            placeholder="Descreva o produto para destacar os principais diferenciais."
            rows={4}
            className="w-full rounded-xl border border-[#6B6B6B] bg-black p-3 text-white outline-none transition focus:border-yellow-400"
          />
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-200">
          <input
            type="checkbox"
            checked={produtoForm.disponivel}
            onChange={onToggleProdutoDisponivel}
            className="h-4 w-4 cursor-pointer accent-yellow-500"
          />
          Produto disponível para venda
        </label>

        {produtoErroAcao ? <p className="text-sm text-red-400">{produtoErroAcao}</p> : null}

        {produtoForm.id && produtoConfirmandoExclusao ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
            <p className="font-medium text-red-200">Confirmar exclusao do produto</p>
            <p className="mt-2">
              O produto "{produtoForm.nome.trim() || "selecionado"}" deixará de aparecer para os
              usuarios, mas continuará salvo no banco.
            </p>
          </div>
        ) : null}

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

            {produtoForm.id ? (
              produtoConfirmandoExclusao ? (
                <>
                  <Botao
                    type="button"
                    variant="secondary"
                    disabled={isProcessandoProduto}
                    onClick={voltarConfirmacaoExclusao}
                    className="h-11 sm:w-auto sm:px-6"
                  >
                    Voltar
                  </Botao>

                  <Botao
                    type="button"
                    disabled={isProcessandoProduto}
                    onClick={onConfirmarRemocaoProdutoAtual}
                    className="h-11 border-red-400/20 bg-red-500/80 text-white hover:bg-red-500 sm:w-auto sm:px-6"
                    icon={<Trash2 className="h-4 w-4" />}
                  >
                    {isRemovendoProduto ? "Excluindo..." : "Confirmar exclusao"}
                  </Botao>
                </>
              ) : (
                <Botao
                  type="button"
                  variant="secondary"
                  disabled={isProcessandoProduto}
                  onClick={onSolicitarRemocaoProdutoAtual}
                  className="h-11 border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/20 sm:w-auto sm:px-6"
                  icon={<Trash2 className="h-4 w-4" />}
                >
                  Excluir produto
                </Botao>
              )
            ) : null}
          </div>

          {!produtoConfirmandoExclusao ? (
            <Botao
              type="submit"
              disabled={isProcessandoProduto}
              className="h-11 sm:w-auto sm:px-6"
            >
              {isSalvandoProduto
                ? "Salvando..."
                : produtoForm.id
                  ? "Salvar produto"
                  : "Criar produto"}
            </Botao>
          ) : null}
        </div>
      </form>
    </ProfileModal>
  );
}
