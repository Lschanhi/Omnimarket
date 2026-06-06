import type { ChangeEvent, FormEvent } from "react";
import { PackageCheck, Plus, Truck } from "lucide-react";
import { Botao } from "../../../Components/Botao";
import { Input } from "../../../Components/Input";
import { ProfileModal } from "../../../Components/perfil/ProfileModal";
import { ProfileSkeleton } from "../../../Components/perfil/ProfileSkeleton";
import {
  TIPOS_ENTREGA_OPTIONS,
  type LojaEntregaOpcao,
} from "../../../Services/produtos/lojaEntregaService";
import type { LojaEntregaFormState } from "./tipos";
import { formatarMoeda, obterTipoEntregaLabel } from "./utilitarios";

type ModalEntregasLojaProps = {
  descricao: string;
  entregaEmEdicao: boolean;
  entregaErroAcao: string;
  entregaLojaForm: LojaEntregaFormState;
  entregaRemovendoId: number | null;
  entregasLoja: LojaEntregaOpcao[];
  handleCancelarEntrega: () => void;
  handleEditarEntrega: (opcao: LojaEntregaOpcao) => void;
  handleNovaEntrega: () => void;
  handleRemoverEntregaLoja: (opcao: LojaEntregaOpcao) => void;
  isCarregandoEntregas: boolean;
  isOpen: boolean;
  isSalvandoEntrega: boolean;
  onChangeEntregaInput: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleEntregaAtiva: (event: ChangeEvent<HTMLInputElement>) => void;
  tipoEntregaAtualEhRetirada: boolean;
  titulo: string;
};

export function ModalEntregasLoja({
  descricao,
  entregaEmEdicao,
  entregaErroAcao,
  entregaLojaForm,
  entregaRemovendoId,
  entregasLoja,
  handleCancelarEntrega,
  handleEditarEntrega,
  handleNovaEntrega,
  handleRemoverEntregaLoja,
  isCarregandoEntregas,
  isOpen,
  isSalvandoEntrega,
  onChangeEntregaInput,
  onClose,
  onSubmit,
  onToggleEntregaAtiva,
  tipoEntregaAtualEhRetirada,
  titulo,
}: ModalEntregasLojaProps) {
  return (
    <ProfileModal isOpen={isOpen} title={titulo} description={descricao} onClose={onClose}>
      <div className="space-y-5">
        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Entregas cadastradas</h3>
              <p className="text-sm text-neutral-400">
                Edite as modalidades da sua loja ou crie uma nova opção de frete.
              </p>
            </div>

            <Botao
              type="button"
              variant="secondary"
              onClick={handleNovaEntrega}
              className="h-11 sm:w-auto sm:px-5"
              icon={<Plus className="h-4 w-4" />}
            >
              Nova opção
            </Botao>
          </div>

          {isCarregandoEntregas ? (
            <ProfileSkeleton lines={3} cardCount={2} />
          ) : entregasLoja.length > 0 ? (
            <div className="space-y-3">
              {entregasLoja.map((opcao) => {
                const estaEditando = entregaLojaForm.id === opcao.id;
                const estaRemovendo = entregaRemovendoId === opcao.id;

                return (
                  <div
                    key={opcao.id}
                    className={`rounded-2xl border p-4 transition ${
                      estaEditando
                        ? "border-yellow-400/40 bg-yellow-400/10"
                        : "border-white/10 bg-black/40"
                    }`.trim()}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-yellow-300">
                            <Truck className="h-3.5 w-3.5" />
                            {obterTipoEntregaLabel(opcao.tipoEntregaId)}
                          </span>

                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                              opcao.ativa
                                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                : "border-white/10 bg-white/5 text-neutral-400"
                            }`.trim()}
                          >
                            {opcao.ativa ? "Ativa" : "Pausada"}
                          </span>
                        </div>

                        <div>
                          <p className="text-base font-semibold text-white">{opcao.nome}</p>
                          <p className="text-sm text-neutral-400">{opcao.resumoCobertura}</p>
                        </div>

                        {opcao.observacao?.trim() ? (
                          <p className="text-sm text-neutral-500">{opcao.observacao}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-3 sm:items-end">
                        <div className="text-sm text-neutral-300">
                          <span className="font-medium text-white">
                            {formatarMoeda(opcao.valorFrete)}
                          </span>
                          {" · "}
                          prazo de {opcao.prazoEntregaDias} dia(s)
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditarEntrega(opcao)}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleRemoverEntregaLoja(opcao);
                            }}
                            disabled={estaRemovendo}
                            className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200 transition hover:border-red-400/40 hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {estaRemovendo ? "Removendo..." : "Excluir"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-yellow-400/25 bg-yellow-400/5 px-4 py-5 text-sm text-zinc-300">
              Nenhuma opção de entrega foi cadastrada ainda. Use o formulário abaixo para criar a
              primeira.
            </div>
          )}
        </section>

        <form className="space-y-5" onSubmit={onSubmit}>
          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {entregaEmEdicao ? "Editar opcao de entrega" : "Nova opcao de entrega"}
                </h3>
                <p className="text-sm text-neutral-400">
                  Defina a modalidade, o frete e o prazo exibidos no checkout da loja.
                </p>
              </div>

              {entregaEmEdicao ? (
                <Botao
                  type="button"
                  variant="secondary"
                  onClick={handleCancelarEntrega}
                  className="h-11 sm:w-auto sm:px-5"
                >
                  Nova opção
                </Botao>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="tipoEntregaId" className="text-[#6b6b6b]">
                  Tipo de entrega
                </label>
                <select
                  id="tipoEntregaId"
                  name="tipoEntregaId"
                  value={entregaLojaForm.tipoEntregaId}
                  onChange={onChangeEntregaInput}
                  className="w-full rounded-xl border border-[#6B6B6B] bg-black p-2 text-white outline-none transition focus:border-yellow-400"
                >
                  {TIPOS_ENTREGA_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Nome exibido"
                id="entregaNome"
                name="nome"
                placeholder="Entrega expressa"
                value={entregaLojaForm.nome}
                onChange={onChangeEntregaInput}
                required
              />

              <Input
                label="Valor do frete"
                id="entregaValorFrete"
                name="valorFrete"
                inputMode="decimal"
                placeholder="12,90"
                value={entregaLojaForm.valorFrete}
                onChange={onChangeEntregaInput}
                disabled={tipoEntregaAtualEhRetirada}
                required
              />

              <Input
                label="Prazo em dias"
                id="entregaPrazoEntregaDias"
                name="prazoEntregaDias"
                type="number"
                min="0"
                max="365"
                value={entregaLojaForm.prazoEntregaDias}
                onChange={onChangeEntregaInput}
                required
              />
            </div>

            {tipoEntregaAtualEhRetirada ? (
              <p className="text-xs text-neutral-500">
                A modalidade Retirada usa frete zero automaticamente.
              </p>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="entregaObservacao" className="text-[#6b6b6b]">
                Observação
              </label>
              <textarea
                id="entregaObservacao"
                name="observacao"
                rows={3}
                value={entregaLojaForm.observacao}
                onChange={onChangeEntregaInput}
                placeholder="Ex.: Entregas para a capital em horario comercial."
                className="w-full rounded-xl border border-[#6B6B6B] bg-black p-3 text-white placeholder-[#6b6b6b] outline-none transition focus:border-yellow-400"
              />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-200">
              <input
                type="checkbox"
                checked={entregaLojaForm.ativa}
                onChange={onToggleEntregaAtiva}
                className="h-4 w-4 cursor-pointer accent-yellow-500"
              />
              Opção ativa no checkout da loja
            </label>
          </section>

          {entregaErroAcao ? <p className="text-sm text-red-400">{entregaErroAcao}</p> : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Botao
              type="button"
              variant="secondary"
              onClick={onClose}
              className="h-11 sm:w-auto sm:px-6"
            >
              Fechar
            </Botao>

            <Botao
              type="submit"
              disabled={isSalvandoEntrega}
              className="h-11 sm:w-auto sm:px-6"
              icon={<PackageCheck className="h-4 w-4" />}
            >
              {isSalvandoEntrega
                ? "Salvando..."
                : entregaEmEdicao
                  ? "Salvar entrega"
                  : "Criar entrega"}
            </Botao>
          </div>
        </form>
      </div>
    </ProfileModal>
  );
}
