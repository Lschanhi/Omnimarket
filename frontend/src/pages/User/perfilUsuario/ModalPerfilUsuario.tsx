import type { ChangeEvent, FormEvent } from "react";
import { LockIcon, Mail, MapPin, Minus, Phone, Plus, User } from "lucide-react";
import { Botao } from "../../../Components/Botao";
import { Input } from "../../../Components/Input";
import { ProfileModal } from "../../../Components/perfil/ProfileModal";
import type { TipoLogradouroOption } from "../../../Services/user/enderecoService";
import type {
  PerfilEnderecoFormState,
  PerfilFormState,
  PerfilTelefoneFormState,
} from "./tipos";

type ModalPerfilUsuarioProps = {
  enderecosForm: PerfilEnderecoFormState[];
  isOpen: boolean;
  isSalvandoPerfil: boolean;
  novoEnderecoForm: PerfilEnderecoFormState | null;
  novoTelefoneForm: PerfilTelefoneFormState | null;
  onAdicionarEndereco: () => void;
  onAdicionarTelefone: () => void;
  onChangeEnderecoExistente: (
    index: number,
    campo: keyof PerfilEnderecoFormState,
    valor: string,
  ) => void;
  onChangeNovoEndereco: (campo: keyof PerfilEnderecoFormState, valor: string) => void;
  onChangeNovoTelefone: (valor: string) => void;
  onChangePerfilInput: (event: ChangeEvent<HTMLInputElement>) => void;
  onChangeTelefoneExistente: (index: number, valor: string) => void;
  onClose: () => void;
  onRemoverEndereco: (index: number) => void;
  onRemoverNovoEndereco: () => void;
  onRemoverNovoTelefone: () => void;
  onRemoverTelefone: (index: number) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleEnderecoPrincipal: (index: number) => void;
  onToggleNovoEnderecoPrincipal: () => void;
  onToggleNovoTelefonePrincipal: () => void;
  onToggleTelefonePrincipal: (index: number) => void;
  perfilErroAcao: string;
  perfilForm: PerfilFormState;
  telefonesForm: PerfilTelefoneFormState[];
  tiposLogradouro: TipoLogradouroOption[];
};

export function ModalPerfilUsuario({
  enderecosForm,
  isOpen,
  isSalvandoPerfil,
  novoEnderecoForm,
  novoTelefoneForm,
  onAdicionarEndereco,
  onAdicionarTelefone,
  onChangeEnderecoExistente,
  onChangeNovoEndereco,
  onChangeNovoTelefone,
  onChangePerfilInput,
  onChangeTelefoneExistente,
  onClose,
  onRemoverEndereco,
  onRemoverNovoEndereco,
  onRemoverNovoTelefone,
  onRemoverTelefone,
  onSubmit,
  onToggleEnderecoPrincipal,
  onToggleNovoEnderecoPrincipal,
  onToggleNovoTelefonePrincipal,
  onToggleTelefonePrincipal,
  perfilErroAcao,
  perfilForm,
  telefonesForm,
  tiposLogradouro,
}: ModalPerfilUsuarioProps) {
  return (
    <ProfileModal
      isOpen={isOpen}
      title="Editar perfil"
      description="Atualize os dados básicos da sua conta sem sair da página de perfil."
      onClose={onClose}
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nome"
            id="nome"
            name="nome"
            placeholder="Seu nome"
            value={perfilForm.nome}
            onChange={onChangePerfilInput}
            icon={<User className="h-5 w-5" />}
            required
          />

          <Input
            label="Sobrenome"
            id="sobrenome"
            name="sobrenome"
            placeholder="Seu sobrenome"
            value={perfilForm.sobrenome}
            onChange={onChangePerfilInput}
            icon={<User className="h-5 w-5" />}
            required
          />
        </div>

        <Input
          label="Email"
          id="email"
          name="email"
          type="email"
          placeholder="voce@exemplo.com"
          value={perfilForm.email}
          onChange={onChangePerfilInput}
          icon={<Mail className="h-5 w-5" />}
          required
        />

        <Input
          label="Nova senha (opcional)"
          id="password"
          name="password"
          type="password"
          placeholder="Preencha apenas se quiser trocar a senha"
          value={perfilForm.password}
          onChange={onChangePerfilInput}
          icon={<LockIcon className="h-5 w-5" />}
        />

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-white">Telefones</h3>
              <p className="text-sm text-neutral-400">
                Edite os telefones cadastrados e adicione mais um se precisar.
              </p>
            </div>

            <button
              type="button"
              onClick={onAdicionarTelefone}
              disabled={Boolean(novoTelefoneForm)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                novoTelefoneForm
                  ? "cursor-not-allowed border-white/10 bg-white/5 text-neutral-600"
                  : "border-yellow-400/30 bg-yellow-400/10 text-yellow-300 hover:border-yellow-400/50 hover:bg-yellow-400/20"
              }`}
              aria-label="Adicionar telefone"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {telefonesForm.map((telefone, index) => (
              <div
                key={telefone.id ?? `telefone-${index}`}
                className="rounded-2xl border border-white/10 bg-black/40 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Phone className="h-4 w-4 text-yellow-400" />
                    <span>Telefone {index + 1}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-200">
                      <input
                        type="checkbox"
                        checked={telefone.isPrincipal}
                        onChange={() => onToggleTelefonePrincipal(index)}
                        className="h-3.5 w-3.5 cursor-pointer accent-yellow-500"
                      />
                      Principal
                    </label>

                    <button
                      type="button"
                      onClick={() => onRemoverTelefone(index)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10 text-red-300 transition hover:border-red-400/40 hover:bg-red-400/20"
                      aria-label={`Remover telefone ${index + 1}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <Input
                  label="Número"
                  id={`telefone-${index}`}
                  name={`telefone-${index}`}
                  placeholder="(11) 97777-7932"
                  inputMode="numeric"
                  maxLength={15}
                  value={telefone.numero}
                  onChange={(event) => onChangeTelefoneExistente(index, event.target.value)}
                  required
                />
              </div>
            ))}

            {novoTelefoneForm ? (
              <div className="rounded-2xl border border-dashed border-yellow-400/25 bg-yellow-400/5 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Plus className="h-4 w-4 text-yellow-400" />
                    <span>Novo telefone</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-200">
                      <input
                        type="checkbox"
                        checked={novoTelefoneForm.isPrincipal}
                        onChange={onToggleNovoTelefonePrincipal}
                        className="h-3.5 w-3.5 cursor-pointer accent-yellow-500"
                      />
                      Principal
                    </label>

                    <button
                      type="button"
                      onClick={onRemoverNovoTelefone}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10 text-red-300 transition hover:border-red-400/40 hover:bg-red-400/20"
                      aria-label="Remover novo telefone"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <Input
                  label="Numero"
                  id="novo-telefone"
                  name="novoTelefone"
                  placeholder="(11) 97777-7932"
                  inputMode="numeric"
                  maxLength={15}
                  value={novoTelefoneForm.numero}
                  onChange={(event) => onChangeNovoTelefone(event.target.value)}
                />
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-white">Enderecos</h3>
              <p className="text-sm text-neutral-400">
                Revise os endereços atuais e use o `+` para abrir mais um cadastro.
              </p>
            </div>

            <button
              type="button"
              onClick={onAdicionarEndereco}
              disabled={Boolean(novoEnderecoForm)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                novoEnderecoForm
                  ? "cursor-not-allowed border-white/10 bg-white/5 text-neutral-600"
                  : "border-yellow-400/30 bg-yellow-400/10 text-yellow-300 hover:border-yellow-400/50 hover:bg-yellow-400/20"
              }`}
              aria-label="Adicionar endereco"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {enderecosForm.map((endereco, index) => (
              <div
                key={endereco.id ?? `endereco-${index}`}
                className="rounded-2xl border border-white/10 bg-black/40 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <MapPin className="h-4 w-4 text-yellow-400" />
                    <span>Endereço {index + 1}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-200">
                      <input
                        type="checkbox"
                        checked={endereco.isPrincipal}
                        onChange={() => onToggleEnderecoPrincipal(index)}
                        className="h-3.5 w-3.5 cursor-pointer accent-yellow-500"
                      />
                      Principal
                    </label>

                    <button
                      type="button"
                      onClick={() => onRemoverEndereco(index)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10 text-red-300 transition hover:border-red-400/40 hover:bg-red-400/20"
                      aria-label={`Remover endereco ${index + 1}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`tipoLogradouro-${index}`} className="text-[#6b6b6b]">
                      Tipo de logradouro
                    </label>
                    <select
                      id={`tipoLogradouro-${index}`}
                      value={endereco.tipoLogradouro}
                      onChange={(event) =>
                        onChangeEnderecoExistente(index, "tipoLogradouro", event.target.value)
                      }
                      className="w-full rounded-xl border border-[#6B6B6B] bg-black p-2 text-white outline-none transition focus:border-yellow-400"
                    >
                      {tiposLogradouro.map((tipo) => (
                        <option key={tipo.codigo} value={tipo.codigo}>
                          {tipo.descricao}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Nome do endereco"
                    id={`nomeEndereco-${index}`}
                    name={`nomeEndereco-${index}`}
                    autoComplete="off"
                    value={endereco.nomeEndereco}
                    onChange={(event) =>
                      onChangeEnderecoExistente(index, "nomeEndereco", event.target.value)
                    }
                    required
                  />

                  <Input
                    label="Numero"
                    id={`numeroEndereco-${index}`}
                    name={`numeroEndereco-${index}`}
                    autoComplete="off"
                    value={endereco.numero}
                    onChange={(event) =>
                      onChangeEnderecoExistente(index, "numero", event.target.value)
                    }
                    required
                  />

                  <Input
                    label="Complemento"
                    id={`complementoEndereco-${index}`}
                    name={`complementoEndereco-${index}`}
                    autoComplete="off"
                    value={endereco.complemento}
                    onChange={(event) =>
                      onChangeEnderecoExistente(index, "complemento", event.target.value)
                    }
                  />

                  <Input
                    label="CEP"
                    id={`cepEndereco-${index}`}
                    name={`cepEndereco-${index}`}
                    autoComplete="off"
                    inputMode="numeric"
                    value={endereco.cep}
                    onChange={(event) =>
                      onChangeEnderecoExistente(index, "cep", event.target.value)
                    }
                    required
                  />

                  <Input
                    label="Cidade"
                    id={`cidadeEndereco-${index}`}
                    name={`cidadeEndereco-${index}`}
                    autoComplete="off"
                    value={endereco.cidade}
                    onChange={(event) =>
                      onChangeEnderecoExistente(index, "cidade", event.target.value)
                    }
                    required
                  />

                  <Input
                    label="UF"
                    id={`ufEndereco-${index}`}
                    name={`ufEndereco-${index}`}
                    autoComplete="off"
                    value={endereco.uf}
                    onChange={(event) =>
                      onChangeEnderecoExistente(index, "uf", event.target.value.toUpperCase())
                    }
                    maxLength={2}
                    required
                  />
                </div>
              </div>
            ))}

            {novoEnderecoForm ? (
              <div className="rounded-2xl border border-dashed border-yellow-400/25 bg-yellow-400/5 p-4">
                <div className="mb-4 flex items-center justify-between gap-3 text-sm font-medium text-white">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-yellow-400" />
                    <span>Novo endereço</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-200">
                      <input
                        type="checkbox"
                        checked={novoEnderecoForm.isPrincipal}
                        onChange={onToggleNovoEnderecoPrincipal}
                        className="h-3.5 w-3.5 cursor-pointer accent-yellow-500"
                      />
                      Principal
                    </label>

                    <button
                      type="button"
                      onClick={onRemoverNovoEndereco}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10 text-red-300 transition hover:border-red-400/40 hover:bg-red-400/20"
                      aria-label="Remover novo endereco"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="novoTipoLogradouro" className="text-[#6b6b6b]">
                      Tipo de logradouro
                    </label>
                    <select
                      id="novoTipoLogradouro"
                      value={novoEnderecoForm.tipoLogradouro}
                      onChange={(event) =>
                        onChangeNovoEndereco("tipoLogradouro", event.target.value)
                      }
                      className="w-full rounded-xl border border-[#6B6B6B] bg-black p-2 text-white outline-none transition focus:border-yellow-400"
                    >
                      {tiposLogradouro.map((tipo) => (
                        <option key={tipo.codigo} value={tipo.codigo}>
                          {tipo.descricao}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Nome do endereco"
                    id="novoNomeEndereco"
                    name="novoNomeEndereco"
                    autoComplete="off"
                    value={novoEnderecoForm.nomeEndereco}
                    onChange={(event) => onChangeNovoEndereco("nomeEndereco", event.target.value)}
                  />

                  <Input
                    label="Numero"
                    id="novoNumeroEndereco"
                    name="novoNumeroEndereco"
                    autoComplete="off"
                    value={novoEnderecoForm.numero}
                    onChange={(event) => onChangeNovoEndereco("numero", event.target.value)}
                  />

                  <Input
                    label="Complemento"
                    id="novoComplementoEndereco"
                    name="novoComplementoEndereco"
                    autoComplete="off"
                    value={novoEnderecoForm.complemento}
                    onChange={(event) => onChangeNovoEndereco("complemento", event.target.value)}
                  />

                  <Input
                    label="CEP"
                    id="novoCepEndereco"
                    name="novoCepEndereco"
                    autoComplete="off"
                    inputMode="numeric"
                    value={novoEnderecoForm.cep}
                    onChange={(event) => onChangeNovoEndereco("cep", event.target.value)}
                  />

                  <Input
                    label="Cidade"
                    id="novaCidadeEndereco"
                    name="novaCidadeEndereco"
                    autoComplete="off"
                    value={novoEnderecoForm.cidade}
                    onChange={(event) => onChangeNovoEndereco("cidade", event.target.value)}
                  />

                  <Input
                    label="UF"
                    id="novaUfEndereco"
                    name="novaUfEndereco"
                    autoComplete="off"
                    value={novoEnderecoForm.uf}
                    onChange={(event) => onChangeNovoEndereco("uf", event.target.value.toUpperCase())}
                    maxLength={2}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {perfilErroAcao ? <p className="text-sm text-red-400">{perfilErroAcao}</p> : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Botao
            type="button"
            variant="secondary"
            onClick={onClose}
            className="h-11 sm:w-auto sm:px-6"
          >
            Cancelar
          </Botao>

          <Botao type="submit" disabled={isSalvandoPerfil} className="h-11 sm:w-auto sm:px-6">
            {isSalvandoPerfil ? "Salvando..." : "Salvar perfil"}
          </Botao>
        </div>
      </form>
    </ProfileModal>
  );
}
