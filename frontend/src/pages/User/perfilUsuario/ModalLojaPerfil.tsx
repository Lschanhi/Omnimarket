import type { ChangeEvent, FormEvent } from "react";
import { Store } from "lucide-react";
import { Botao } from "../../../Components/Botao";
import { Input } from "../../../Components/Input";
import { ProfileModal } from "../../../Components/perfil/ProfileModal";
import type { LojaFormState } from "./tipos";

type ModalLojaPerfilProps = {
  descricao: string;
  isOpen: boolean;
  isSalvandoLoja: boolean;
  lojaErroAcao: string;
  lojaForm: LojaFormState;
  onChangeLojaInput: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleLojaAtiva: (event: ChangeEvent<HTMLInputElement>) => void;
  temLoja: boolean;
  titulo: string;
};

export function ModalLojaPerfil({
  descricao,
  isOpen,
  isSalvandoLoja,
  lojaErroAcao,
  lojaForm,
  onChangeLojaInput,
  onClose,
  onSubmit,
  onToggleLojaAtiva,
  temLoja,
  titulo,
}: ModalLojaPerfilProps) {
  return (
    <ProfileModal isOpen={isOpen} title={titulo} description={descricao} onClose={onClose}>
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-1">
          <Input
            label="Nome fantasia"
            id="nomeFantasia"
            name="nomeFantasia"
            placeholder="Nome da sua loja"
            value={lojaForm.nomeFantasia}
            onChange={onChangeLojaInput}
            icon={<Store className="h-5 w-5" />}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="tipoDocumentoFiscal" className="text-[#6b6b6b]">
              Tipo do documento
            </label>
            <select
              id="tipoDocumentoFiscal"
              name="tipoDocumentoFiscal"
              value={lojaForm.tipoDocumentoFiscal}
              onChange={onChangeLojaInput}
              className="w-full rounded-xl border border-[#6B6B6B] bg-black p-2 text-white outline-none transition focus:border-yellow-400"
            >
              <option value="1">CPF</option>
              <option value="2">CNPJ</option>
            </select>
          </div>

          <Input
            label="Documento fiscal"
            id="documentoFiscal"
            name="documentoFiscal"
            placeholder={
              lojaForm.tipoDocumentoFiscal === "2"
                ? "00.000.000/0000-00"
                : "000.000.000-00"
            }
            value={lojaForm.documentoFiscal}
            onChange={onChangeLojaInput}
            required
          />
        </div>

        <Input
          label="Email de contato"
          id="emailContato"
          name="emailContato"
          type="email"
          placeholder="loja@exemplo.com"
          value={lojaForm.emailContato}
          onChange={onChangeLojaInput}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="descricao" className="text-[#6b6b6b]">
            Descrição
          </label>
          <textarea
            id="descricao"
            name="descricao"
            rows={4}
            placeholder="Conte um pouco sobre a sua loja."
            value={lojaForm.descricao}
            onChange={onChangeLojaInput}
            className="w-full rounded-xl border border-[#6B6B6B] bg-black p-3 text-white placeholder-[#6b6b6b] outline-none transition focus:border-yellow-400"
          />
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-200">
          <input
            type="checkbox"
            checked={lojaForm.ativa}
            onChange={onToggleLojaAtiva}
            className="h-4 w-4 cursor-pointer accent-yellow-500"
          />
          Loja ativa para receber publicações e vendas
        </label>

        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-100">
          O cadastro usa o endereço e o telefone principal do seu perfil atual.
        </div>

        {lojaErroAcao ? <p className="text-sm text-red-400">{lojaErroAcao}</p> : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Botao
            type="button"
            variant="secondary"
            onClick={onClose}
            className="h-11 sm:w-auto sm:px-6"
          >
            Cancelar
          </Botao>

          <Botao type="submit" disabled={isSalvandoLoja} className="h-11 sm:w-auto sm:px-6">
            {isSalvandoLoja ? "Salvando..." : temLoja ? "Salvar loja" : "Criar loja"}
          </Botao>
        </div>
      </form>
    </ProfileModal>
  );
}
