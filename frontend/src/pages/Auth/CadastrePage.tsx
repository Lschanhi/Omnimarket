import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  IdCard,
  LockIcon,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  Store,
  User,
} from "lucide-react";
import { Botao } from "../../Components/Botao";
import { PageLayout } from "../../Components/PageLayout";
import { ApiError } from "../../Services/http/apiClient";
import { loginUsuario, registrarUsuario } from "../../Services/auth/authService";
import { obterPerfilUsuario } from "../../Services/user/usuarioService";
import {
  criarMinhaLoja,
  type TipoDocumentoFiscalLoja,
} from "../../Services/user/lojaService";
import {
  TIPOS_LOGRADOURO_FALLBACK,
} from "../../Services/user/enderecoService";
import { normalizarTelefoneParaApi } from "../../Services/user/telefoneService";
import type {
  CadastroFormData,
  FormErrors,
  TipoCadastro,
  TipoDocumentoFiscalCadastro,
} from "../../types/cadastroFormData";
import {
  formatarCep,
  formatarCpf,
  formatarDocumentoFiscal,
  formatarTelefone,
} from "../../utils/masks";
import {
  TERMO_FISCAL_VENDEDOR_CHECKBOX_LABEL,
  TERMO_FISCAL_VENDEDOR_ITENS,
  TERMO_USO_CONTA_CHECKBOX_LABEL,
  TERMO_USO_CONTA_ITENS,
} from "../../utils/termosResponsabilidade";
import { validarFormulario } from "../../utils/validators";

type CampoCadastroProps = {
  label: string;
  error?: string;
  icon?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

type CampoSelectProps = {
  label: string;
  error?: string;
  icon?: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>;

type BlocoEnderecoCadastroProps = {
  errors: FormErrors;
  formData: CadastroFormData;
  isVisible: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

type CampoEnderecoCadastro =
  | "enderecoTipoLogradouro"
  | "enderecoNome"
  | "enderecoNumero"
  | "enderecoComplemento"
  | "enderecoCep"
  | "enderecoCidade"
  | "enderecoUf";

type BlocoTermoCheckboxProps = {
  checkboxLabel: string;
  checked: boolean;
  descricao: string;
  error?: string;
  id: string;
  itens: string[];
  name: "aceitouTermosUso" | "aceitouTermoFiscalResponsabilidade";
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  titulo: string;
  tone?: "default" | "warning";
};

const CAMPOS_ENDERECO_CADASTRO: CampoEnderecoCadastro[] = [
  "enderecoTipoLogradouro",
  "enderecoNome",
  "enderecoNumero",
  "enderecoComplemento",
  "enderecoCep",
  "enderecoCidade",
  "enderecoUf",
];

const CAMPOS_ENDERECO_CADASTRO_PREENCHIMENTO: CampoEnderecoCadastro[] = [
  "enderecoNome",
  "enderecoNumero",
  "enderecoComplemento",
  "enderecoCep",
  "enderecoCidade",
  "enderecoUf",
];

const TIPO_LOGRADOURO_PADRAO = TIPOS_LOGRADOURO_FALLBACK[0]?.codigo ?? "Rua";

const initialFormData: CadastroFormData = {
  tipoCadastro: "comprador",
  nomeCompleto: "",
  email: "",
  senha: "",
  confirmarSenha: "",
  cpf: "",
  telefone: "",
  dataNascimento: "",
  aceitouTermosUso: false,
  aceitouTermoFiscalResponsabilidade: false,
  nomeFantasia: "",
  tipoDocumentoFiscalLoja: "1",
  documentoFiscalLoja: "",
  enderecoTipoLogradouro: TIPO_LOGRADOURO_PADRAO,
  enderecoNome: "",
  enderecoNumero: "",
  enderecoComplemento: "",
  enderecoCep: "",
  enderecoCidade: "",
  enderecoUf: "",
};

function CampoCadastro({ label, error, className, icon, ...props }: CampoCadastroProps) {
  const baseStyle =
    "w-full rounded-2xl border bg-[#111111] px-4 py-3 text-white outline-none transition placeholder:text-neutral-500 focus:ring-2";
  const stateStyle = error
    ? "border-red-500/80 focus:border-red-400 focus:ring-red-500/30"
    : "border-white/10 focus:border-yellow-400 focus:ring-yellow-400/20";

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={props.id} className="text-sm font-medium text-neutral-200">
        {label}
      </label>

      <div className="relative">
        {icon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </span>
        ) : null}

        <input
          {...props}
          className={`${baseStyle} ${stateStyle} ${icon ? "pl-10" : ""} ${className}`.trim()}
        />
      </div>

      {error ? <span className="text-sm text-red-400">{error}</span> : null}
    </div>
  );
}

function CampoSelect({ children, label, error, className, icon, ...props }: CampoSelectProps) {
  const baseStyle =
    "w-full rounded-2xl border bg-[#111111] px-4 py-3 text-white outline-none transition focus:ring-2";
  const stateStyle = error
    ? "border-red-500/80 focus:border-red-400 focus:ring-red-500/30"
    : "border-white/10 focus:border-yellow-400 focus:ring-yellow-400/20";

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={props.id} className="text-sm font-medium text-neutral-200">
        {label}
      </label>

      <div className="relative">
        {icon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </span>
        ) : null}

        <select
          {...props}
          className={`${baseStyle} ${stateStyle} ${icon ? "pl-10" : ""} ${className}`.trim()}
        >
          {children}
        </select>
      </div>

      {error ? <span className="text-sm text-red-400">{error}</span> : null}
    </div>
  );
}

function BlocoEnderecoCadastro({
  errors,
  formData,
  isVisible,
  onChange,
}: BlocoEnderecoCadastroProps) {
  const mostrarCampos = isVisible || temConteudoNoEnderecoCadastro(formData);

  if (!mostrarCampos) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <CampoSelect
          label="Tipo de logradouro"
          id="enderecoTipoLogradouro"
          name="enderecoTipoLogradouro"
          value={formData.enderecoTipoLogradouro}
          onChange={onChange}
          error={errors.enderecoTipoLogradouro}
          icon={<MapPin className="h-5 w-5" />}
        >
          {TIPOS_LOGRADOURO_FALLBACK.map((tipo) => (
            <option key={tipo.codigo} value={tipo.codigo}>
              {tipo.descricao}
            </option>
          ))}
        </CampoSelect>

        <CampoCadastro
          label="Nome do endereco"
          id="enderecoNome"
          name="enderecoNome"
          value={formData.enderecoNome}
          onChange={onChange}
          placeholder="Rua, avenida ou local"
          error={errors.enderecoNome}
          icon={<MapPin className="h-5 w-5" />}
        />

        <CampoCadastro
          label="Numero"
          id="enderecoNumero"
          name="enderecoNumero"
          value={formData.enderecoNumero}
          onChange={onChange}
          placeholder="123"
          error={errors.enderecoNumero}
        />

        <CampoCadastro
          label="Complemento"
          id="enderecoComplemento"
          name="enderecoComplemento"
          value={formData.enderecoComplemento}
          onChange={onChange}
          placeholder="Apartamento, bloco, sala..."
          error={errors.enderecoComplemento}
        />

        <CampoCadastro
          label="CEP"
          id="enderecoCep"
          name="enderecoCep"
          inputMode="numeric"
          maxLength={9}
          value={formData.enderecoCep}
          onChange={onChange}
          placeholder="00000-000"
          error={errors.enderecoCep}
        />

        <CampoCadastro
          label="Cidade"
          id="enderecoCidade"
          name="enderecoCidade"
          value={formData.enderecoCidade}
          onChange={onChange}
          placeholder="Sua cidade"
          error={errors.enderecoCidade}
        />

        <CampoCadastro
          label="UF"
          id="enderecoUf"
          name="enderecoUf"
          maxLength={2}
          value={formData.enderecoUf}
          onChange={onChange}
          placeholder="SP"
          error={errors.enderecoUf}
        />
      </div>
    </div>
  );
}

function BotaoAlternarEndereco({
  aberto,
  onClick,
}: {
  aberto: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
        aberto
          ? "border-red-400/30 bg-red-400/10 text-red-300 hover:border-red-400/50 hover:bg-red-400/20"
          : "border-yellow-400/30 bg-yellow-400/10 text-yellow-300 hover:border-yellow-400/50 hover:bg-yellow-400/20"
      }`}
      aria-label={aberto ? "Ocultar endereco" : "Adicionar endereco"}
    >
      {aberto ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
    </button>
  );
}

function BlocoTermoCheckbox({
  checkboxLabel,
  checked,
  descricao,
  error,
  id,
  itens,
  name,
  onChange,
  titulo,
  tone = "default",
}: BlocoTermoCheckboxProps) {
  const wrapperStyle =
    tone === "warning"
      ? "border-yellow-400/20 bg-yellow-400/5"
      : "border-white/10 bg-white/5";

  return (
    <section className={`space-y-4 rounded-3xl border p-4 ${wrapperStyle}`}>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white">{titulo}</h3>
        <p className="text-sm text-neutral-400">{descricao}</p>
      </div>

      <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-neutral-300">
        {itens.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <label
        htmlFor={id}
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm text-neutral-200 ${
          error ? "border-red-500/40 bg-red-500/10" : "border-white/10 bg-black/30"
        }`}
      >
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-yellow-500"
        />
        <span>{checkboxLabel}</span>
      </label>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </section>
  );
}

function separarNomeCompleto(nomeCompleto: string) {
  const partes = nomeCompleto.trim().split(/\s+/).filter(Boolean);
  const nome = partes[0] ?? "";
  const sobrenome = partes.slice(1).join(" ") || nome;

  return {
    nome,
    sobrenome,
  };
}

function temConteudoNoEnderecoCadastro(formData: CadastroFormData) {
  return CAMPOS_ENDERECO_CADASTRO_PREENCHIMENTO.some((campo) => formData[campo].trim() !== "");
}

function temErroNoEnderecoCadastro(errors: FormErrors) {
  return CAMPOS_ENDERECO_CADASTRO.some((campo) => Boolean(errors[campo]));
}

function limparErrosVendedor(errors: FormErrors) {
  return {
    ...errors,
    nomeFantasia: "",
    tipoDocumentoFiscalLoja: "",
    documentoFiscalLoja: "",
    aceitouTermoFiscalResponsabilidade: "",
  };
}

function limparErrosEndereco(errors: FormErrors) {
  return CAMPOS_ENDERECO_CADASTRO.reduce<FormErrors>(
    (currentErrors, campo) => ({
      ...currentErrors,
      [campo]: "",
    }),
    { ...errors },
  );
}

function limparCamposEndereco(formData: CadastroFormData): CadastroFormData {
  return {
    ...formData,
    enderecoTipoLogradouro: TIPO_LOGRADOURO_PADRAO,
    enderecoNome: "",
    enderecoNumero: "",
    enderecoComplemento: "",
    enderecoCep: "",
    enderecoCidade: "",
    enderecoUf: "",
  };
}

function mapearErrosApiCadastro(error: unknown): FormErrors | null {
  if (!(error instanceof ApiError) || !error.payload || typeof error.payload !== "object") {
    return null;
  }

  const payload = error.payload as {
    errors?: Record<string, string[]>;
  };

  if (!payload.errors) {
    return null;
  }

  const errors: FormErrors = {};

  for (const [fieldPath, messages] of Object.entries(payload.errors)) {
    const message = messages?.[0];

    if (!message) {
      continue;
    }

    const normalizedFieldPath = fieldPath.replace(/\[\d+\]/g, "").toLowerCase();

    if (normalizedFieldPath.includes("cpf")) {
      errors.cpf = message;
      continue;
    }

    if (normalizedFieldPath.includes("email")) {
      errors.email = message;
      continue;
    }

    if (normalizedFieldPath.includes("password") && normalizedFieldPath.includes("confirm")) {
      errors.confirmarSenha = message;
      continue;
    }

    if (normalizedFieldPath.endsWith("password")) {
      errors.senha = message;
      continue;
    }

    if (normalizedFieldPath.includes("aceitoutermos")) {
      errors.aceitouTermosUso = message;
      continue;
    }

    if (normalizedFieldPath.includes("enderecos") && normalizedFieldPath.includes("tipologradouro")) {
      errors.enderecoTipoLogradouro = message;
      continue;
    }

    if (normalizedFieldPath.includes("enderecos") && normalizedFieldPath.includes("nomeendereco")) {
      errors.enderecoNome = message;
      continue;
    }

    if (normalizedFieldPath.includes("enderecos") && normalizedFieldPath.includes("numero")) {
      errors.enderecoNumero = message;
      continue;
    }

    if (normalizedFieldPath.includes("enderecos") && normalizedFieldPath.includes("complemento")) {
      errors.enderecoComplemento = message;
      continue;
    }

    if (normalizedFieldPath.includes("enderecos") && normalizedFieldPath.includes("cep")) {
      errors.enderecoCep = message;
      continue;
    }

    if (normalizedFieldPath.includes("enderecos") && normalizedFieldPath.includes("cidade")) {
      errors.enderecoCidade = message;
      continue;
    }

    if (normalizedFieldPath.includes("enderecos") && normalizedFieldPath.includes("uf")) {
      errors.enderecoUf = message;
      continue;
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function CadastroPage() {
  const [formData, setFormData] = useState<CadastroFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarCamposEndereco, setMostrarCamposEndereco] = useState(false);
  const navigate = useNavigate();
  const isCadastroVendedor = formData.tipoCadastro === "vendedor";
  const enderecoExpandido = mostrarCamposEndereco || temConteudoNoEnderecoCadastro(formData);

  function handleTipoCadastroChange(tipoCadastro: TipoCadastro) {
    setFormData((currentData) => ({
      ...currentData,
      tipoCadastro,
    }));

    setErrors((currentErrors) =>
      tipoCadastro === "vendedor" ? { ...currentErrors } : limparErrosVendedor(currentErrors),
    );

    if (temConteudoNoEnderecoCadastro(formData)) {
      setMostrarCamposEndereco(true);
    }
  }

  function handleToggleEndereco() {
    const enderecoEstaAberto = mostrarCamposEndereco || temConteudoNoEnderecoCadastro(formData);

    if (enderecoEstaAberto) {
      setFormData((currentData) => limparCamposEndereco(currentData));
      setErrors((currentErrors) => limparErrosEndereco(currentErrors));
      setMostrarCamposEndereco(false);
      return;
    }

    setMostrarCamposEndereco(true);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = event.target;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setFormData((currentData) => ({
        ...currentData,
        [target.name]: target.checked,
      }));

      setErrors((currentErrors) => ({
        ...currentErrors,
        [target.name]: "",
      }));

      return;
    }

    const { name, value } = target;

    if (name === "tipoDocumentoFiscalLoja") {
      const tipoDocumentoFiscalLoja = value as TipoDocumentoFiscalCadastro;

      setFormData((currentData) => ({
        ...currentData,
        tipoDocumentoFiscalLoja,
        documentoFiscalLoja: formatarDocumentoFiscal(
          currentData.documentoFiscalLoja,
          tipoDocumentoFiscalLoja,
        ),
      }));

      setErrors((currentErrors) => ({
        ...currentErrors,
        tipoDocumentoFiscalLoja: "",
        documentoFiscalLoja: "",
      }));

      return;
    }

    const valorMascarado =
      name === "cpf"
        ? formatarCpf(value)
        : name === "telefone"
          ? formatarTelefone(value)
          : name === "documentoFiscalLoja"
            ? formatarDocumentoFiscal(value, formData.tipoDocumentoFiscalLoja)
            : name === "enderecoCep"
              ? formatarCep(value)
              : name === "enderecoUf"
                ? value.toUpperCase().slice(0, 2)
                : value;

    setFormData((currentData) => ({
      ...currentData,
      [name]: valorMascarado,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const validationErrors = validarFormulario(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      if (temErroNoEnderecoCadastro(validationErrors)) {
        setMostrarCamposEndereco(true);
      }

      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const { nome, sobrenome } = separarNomeCompleto(formData.nomeCompleto);
      const incluirEnderecoNoCadastro = temConteudoNoEnderecoCadastro(formData);
      const payloadRegistro = {
        cpf: formData.cpf.replace(/\D/g, ""),
        nome,
        sobrenome,
        email: formData.email.trim(),
        password: formData.senha,
        confirmPassword: formData.confirmarSenha,
        aceitouTermos: formData.aceitouTermosUso,
        telefones: [normalizarTelefoneParaApi(formData.telefone, true)],
        enderecos: incluirEnderecoNoCadastro
          ? [
              {
                cep: formData.enderecoCep.replace(/\D/g, ""),
                tipoLogradouro: formData.enderecoTipoLogradouro,
                nomeEndereco: formData.enderecoNome.trim(),
                numero: formData.enderecoNumero.trim(),
                complemento: formData.enderecoComplemento.trim() || undefined,
                cidade: formData.enderecoCidade.trim(),
                uf: formData.enderecoUf.trim().toUpperCase(),
                isPrincipal: true,
              },
            ]
          : undefined,
      };

      await registrarUsuario(payloadRegistro);

      if (!isCadastroVendedor) {
        alert("Cadastro realizado com sucesso!");
        navigate({ to: "/login" });
        return;
      }

      let autenticadoAutomaticamente = false;

      try {
        await loginUsuario(formData.email.trim(), formData.senha);
        autenticadoAutomaticamente = true;

        if (!incluirEnderecoNoCadastro) {
          alert(
            "Sua conta foi criada com sucesso! Quando quiser abrir a loja, adicione um endereco principal no perfil para concluir essa etapa.",
          );
          navigate({ to: "/perfilUsuario" });
          return;
        }

        const perfil = await obterPerfilUsuario();
        const enderecoPrincipal =
          perfil.enderecos.find((endereco) => endereco.isPrincipal && endereco.ativo) ??
          perfil.enderecos.find((endereco) => endereco.ativo);
        const telefonePrincipal =
          perfil.telefones.find((telefone) => telefone.isPrincipal) ?? perfil.telefones[0];

        if (!enderecoPrincipal || !telefonePrincipal) {
          throw new Error(
            "Sua conta foi criada, mas faltou localizar o endereco ou o telefone principal para abrir a loja.",
          );
        }

        await criarMinhaLoja({
          nomeFantasia: formData.nomeFantasia.trim(),
          tipoDocumentoFiscal: Number(
            formData.tipoDocumentoFiscalLoja,
          ) as TipoDocumentoFiscalLoja,
          documentoFiscal: formData.documentoFiscalLoja.trim(),
          emailContato: formData.email.trim(),
          usarEnderecoUsuario: true,
          enderecoUsuarioId: enderecoPrincipal.id,
          usarTelefoneUsuario: true,
          telefoneUsuarioId: telefonePrincipal.id,
          ativa: true,
        });

        alert("Conta e loja criadas com sucesso!");
        navigate({ to: "/perfilUsuario" });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Nao foi possivel concluir o cadastro da loja.";

        alert(
          autenticadoAutomaticamente
            ? `Sua conta foi criada, mas a loja nao foi concluida agora. ${message}`
            : `Sua conta foi criada, mas nao conseguimos entrar automaticamente para finalizar a loja. ${message}`,
        );

        navigate({ to: autenticadoAutomaticamente ? "/perfilUsuario" : "/login" });
      }
    } catch (error) {
      const apiErrors = mapearErrosApiCadastro(error);

      if (apiErrors) {
        setErrors(apiErrors);

        if (temErroNoEnderecoCadastro(apiErrors)) {
          setMostrarCamposEndereco(true);
        }

        return;
      }

      const message =
        error instanceof Error ? error.message : "Nao foi possivel concluir o cadastro.";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageLayout>
      <div className="flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_transparent_45%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))] shadow-[0_24px_80px_rgba(0,0,0,0.45)] lg:grid-cols-[0.95fr_1.1fr]">
          <section className="flex flex-col justify-between gap-8 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_transparent_45%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))] p-6 sm:p-8 lg:p-10">
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1 text-sm font-medium text-yellow-300">
                Cadastro de marketplace
              </span>

              <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Crie sua conta na OmniMarket
                </h1>
                <p className="max-w-xl text-sm leading-6 text-neutral-300 sm:text-base">
                  Cadastre seus dados para comprar, vender e acompanhar seus pedidos
                  em um ambiente moderno, seguro e responsivo.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Cadastro flexivel</p>
                <p className="mt-1 text-sm text-neutral-400">
                  Escolha entre comprador e vendedor no mesmo formulario.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Loja desde o inicio</p>
                <p className="mt-1 text-sm text-neutral-400">
                  Quem vender ja pode sair com a loja preparada e o endereco inicial.
                </p>
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-10">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                  Finalize seu cadastro
                </h2>
                <p className="text-sm text-neutral-400">
                  Preencha os campos obrigatorios para criar sua conta.
                </p>
              </div>

              <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Tipo de cadastro</h3>
                  <p className="text-sm text-neutral-400">
                    Escolha se esta conta sera usada para comprar ou para vender.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      tipo: "comprador" as const,
                      titulo: "Comprador",
                      descricao: "Conta para comprar e acompanhar pedidos.",
                    },
                    {
                      tipo: "vendedor" as const,
                      titulo: "Vendedor",
                      descricao: "Conta com preparo inicial para abrir a loja.",
                    },
                  ].map((opcao) => {
                    const selecionado = formData.tipoCadastro === opcao.tipo;

                    return (
                      <button
                        key={opcao.tipo}
                        type="button"
                        onClick={() => handleTipoCadastroChange(opcao.tipo)}
                        className={`rounded-2xl border px-4 py-4 text-left transition ${
                          selecionado
                            ? "border-yellow-400/60 bg-yellow-400/10 shadow-[0_0_0_1px_rgba(250,204,21,0.22)]"
                            : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/5"
                        }`}
                        aria-pressed={selecionado}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-base font-semibold text-white">
                            {opcao.titulo}
                          </span>
                          <span
                            className={`h-3 w-3 rounded-full ${
                              selecionado ? "bg-yellow-400" : "bg-white/20"
                            }`}
                          />
                        </div>
                        <p className="mt-2 text-sm leading-6 text-neutral-400">
                          {opcao.descricao}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <CampoCadastro
                    label="Nome completo"
                    id="nomeCompleto"
                    name="nomeCompleto"
                    value={formData.nomeCompleto}
                    onChange={handleInputChange}
                    placeholder="Digite seu nome completo"
                    error={errors.nomeCompleto}
                    icon={<User className="h-5 w-5" />}
                  />
                </div>

                <CampoCadastro
                  label="Email"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="voce@exemplo.com"
                  error={errors.email}
                  icon={<Mail className="h-5 w-5" />}
                />

                <CampoCadastro
                  label="Telefone"
                  id="telefone"
                  name="telefone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={15}
                  value={formData.telefone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                  error={errors.telefone}
                  icon={<Phone className="h-5 w-5" />}
                />

                <CampoCadastro
                  label={isCadastroVendedor ? "CPF do responsavel" : "CPF"}
                  id="cpf"
                  name="cpf"
                  inputMode="numeric"
                  maxLength={14}
                  value={formData.cpf}
                  onChange={handleInputChange}
                  placeholder="000.000.000-00"
                  error={errors.cpf}
                  icon={<IdCard className="h-5 w-5" />}
                />

                <CampoCadastro
                  label="Data de nascimento"
                  id="dataNascimento"
                  name="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={handleInputChange}
                  error={errors.dataNascimento}
                  icon={<CalendarDays className="h-5 w-5" />}
                />

                <CampoCadastro
                  label="Senha"
                  id="senha"
                  name="senha"
                  type="password"
                  value={formData.senha}
                  onChange={handleInputChange}
                  placeholder="Minimo de 6 caracteres"
                  error={errors.senha}
                  icon={<LockIcon className="h-5 w-5" />}
                />

                <CampoCadastro
                  label="Confirmacao de senha"
                  id="confirmarSenha"
                  name="confirmarSenha"
                  type="password"
                  value={formData.confirmarSenha}
                  onChange={handleInputChange}
                  placeholder="Repita sua senha"
                  error={errors.confirmarSenha}
                  icon={<LockIcon className="h-5 w-5" />}
                />
              </div>

              {!isCadastroVendedor ? (
                <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-white">Endereco</h3>
                      <p className="text-sm text-neutral-400">
                        Se quiser, voce ja pode adicionar um endereco no cadastro de comprador.
                      </p>
                    </div>

                    <BotaoAlternarEndereco
                      aberto={enderecoExpandido}
                      onClick={handleToggleEndereco}
                    />
                  </div>

                  <BlocoEnderecoCadastro
                    errors={errors}
                    formData={formData}
                    isVisible={mostrarCamposEndereco}
                    onChange={handleInputChange}
                  />
                </section>
              ) : null}

              {isCadastroVendedor ? (
                <>
                  <section className="space-y-4 rounded-3xl border border-yellow-400/15 bg-yellow-400/5 p-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-white">Dados da loja</h3>
                      <p className="text-sm text-neutral-400">
                        Esses dados serao usados para criar sua loja logo apos o cadastro.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <CampoCadastro
                          label="Nome fantasia"
                          id="nomeFantasia"
                          name="nomeFantasia"
                          value={formData.nomeFantasia}
                          onChange={handleInputChange}
                          placeholder="Nome da sua loja"
                          error={errors.nomeFantasia}
                          icon={<Store className="h-5 w-5" />}
                        />
                      </div>

                      <CampoSelect
                        label="Tipo de documento fiscal"
                        id="tipoDocumentoFiscalLoja"
                        name="tipoDocumentoFiscalLoja"
                        value={formData.tipoDocumentoFiscalLoja}
                        onChange={handleInputChange}
                        error={errors.tipoDocumentoFiscalLoja}
                        icon={<IdCard className="h-5 w-5" />}
                      >
                        <option value="1">CPF</option>
                        <option value="2">CNPJ</option>
                      </CampoSelect>

                      <CampoCadastro
                        label="Documento fiscal da loja"
                        id="documentoFiscalLoja"
                        name="documentoFiscalLoja"
                        inputMode="numeric"
                        maxLength={formData.tipoDocumentoFiscalLoja === "2" ? 18 : 14}
                        value={formData.documentoFiscalLoja}
                        onChange={handleInputChange}
                        placeholder={
                          formData.tipoDocumentoFiscalLoja === "2"
                            ? "00.000.000/0000-00"
                            : "000.000.000-00"
                        }
                        error={errors.documentoFiscalLoja}
                        icon={<IdCard className="h-5 w-5" />}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-white">Endereco inicial</h4>
                          <p className="text-sm text-neutral-400">
                            Se quiser abrir a loja agora, clique no botao de mais para preencher o
                            endereco inicial. Se preferir, voce pode concluir essa etapa depois no
                            perfil.
                          </p>
                        </div>

                        <BotaoAlternarEndereco
                          aberto={enderecoExpandido}
                          onClick={handleToggleEndereco}
                        />
                      </div>

                      <BlocoEnderecoCadastro
                        errors={errors}
                        formData={formData}
                        isVisible={mostrarCamposEndereco}
                        onChange={handleInputChange}
                      />
                    </div>
                  </section>

                  <BlocoTermoCheckbox
                    titulo="Termo fiscal para vendedores"
                    descricao="Antes de abrir a loja, confirme que voce entendeu os cuidados fiscais basicos da atividade de venda."
                    id="aceitouTermoFiscalResponsabilidade"
                    name="aceitouTermoFiscalResponsabilidade"
                    checked={formData.aceitouTermoFiscalResponsabilidade}
                    onChange={handleInputChange}
                    itens={TERMO_FISCAL_VENDEDOR_ITENS}
                    checkboxLabel={TERMO_FISCAL_VENDEDOR_CHECKBOX_LABEL}
                    error={errors.aceitouTermoFiscalResponsabilidade}
                    tone="warning"
                  />
                </>
              ) : null}

              <BlocoTermoCheckbox
                titulo="Termo de uso e responsabilidade"
                descricao="Este aceite confirma que a conta sera usada com informacoes verdadeiras e dentro das regras da plataforma."
                id="aceitouTermosUso"
                name="aceitouTermosUso"
                checked={formData.aceitouTermosUso}
                onChange={handleInputChange}
                itens={TERMO_USO_CONTA_ITENS}
                checkboxLabel={TERMO_USO_CONTA_CHECKBOX_LABEL}
                error={errors.aceitouTermosUso}
              />

              <Botao
                type="submit"
                className="h-12 text-sm font-semibold sm:text-base disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading
                  ? "Cadastrando..."
                  : isCadastroVendedor
                    ? temConteudoNoEnderecoCadastro(formData)
                      ? "Criar conta e loja"
                      : "Criar conta"
                    : "Criar conta"}
              </Botao>

              <p className="text-center text-sm text-neutral-400">
                Ja possui uma conta?
                <Link
                  to="/login"
                  className="ml-2 font-semibold text-yellow-400 transition hover:text-yellow-300 hover:underline"
                >
                  Entrar
                </Link>
              </p>
            </form>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
