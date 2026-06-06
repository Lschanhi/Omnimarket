import React, {
  useState,
  type ChangeEvent,
  type FormEvent,
  type InputHTMLAttributes,
} from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, IdCard, LockIcon, Mail, Phone, User } from "lucide-react";
import { Botao } from "../../Components/Botao";
import { PageLayout } from "../../Components/PageLayout";
import { registrarUsuario } from "../../Services/auth/authService";
import { normalizarTelefoneParaApi } from "../../Services/user/telefoneService";
import type { CadastroFormData, FormErrors } from "../../types/cadastroFormData";
import { formatarCpf, formatarTelefone } from "../../utils/masks";
import { validarFormulario } from "../../utils/validators";

type CampoCadastroProps = {
  label: string;
  error?: string;
  icon?: React.ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

const initialFormData: CadastroFormData = {
  nomeCompleto: "",
  email: "",
  senha: "",
  confirmarSenha: "",
  cpf: "",
  telefone: "",
  dataNascimento: "",
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
          className={`${baseStyle} ${stateStyle} pl-10 ${className}`.trim()}
        />
      </div>

      {error ? <span className="text-sm text-red-400">{error}</span> : null}
    </div>
  );
}

export function CadastroPage() {
  const [formData, setFormData] = useState<CadastroFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  function separarNomeCompleto(nomeCompleto: string) {
    const partes = nomeCompleto.trim().split(/\s+/).filter(Boolean);
    const nome = partes[0] ?? "";
    const sobrenome = partes.slice(1).join(" ") || nome;

    return {
      nome,
      sobrenome,
    };
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    const valorMascarado =
      name === "cpf" ? formatarCpf(value) : name === "telefone" ? formatarTelefone(value) : value;

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
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const { nome, sobrenome } = separarNomeCompleto(formData.nomeCompleto);

      await registrarUsuario({
        cpf: formData.cpf.replace(/\D/g, ""),
        nome,
        sobrenome,
        email: formData.email.trim(),
        password: formData.senha,
        confirmPassword: formData.confirmarSenha,
        aceitouTermos: true,
        telefones: [normalizarTelefoneParaApi(formData.telefone)],
      });

      alert("Cadastro realizado com sucesso!");
      navigate({ to: "/login" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível concluir o cadastro.";
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
                <p className="text-sm font-semibold text-white">Cadastro rápido</p>
                <p className="mt-1 text-sm text-neutral-400">
                  Formulário otimizado para celular, tablet e desktop.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Validação imediata</p>
                <p className="mt-1 text-sm text-neutral-400">
                  Erros aparecem abaixo dos campos para facilitar o preenchimento.
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
                  Preencha os campos obrigatórios para criar sua conta.
                </p>
              </div>

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
                  placeholder="você@exemplo.com"
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
                  label="CPF"
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
                  placeholder="Mínimo de 6 caracteres"
                  error={errors.senha}
                  icon={<LockIcon className="h-5 w-5" />}
                />

                <CampoCadastro
                  label="Confirmação de senha"
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

              <Botao
                type="submit"
                className="h-12 text-sm font-semibold sm:text-base disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Cadastrando..." : "Criar conta"}
              </Botao>

              <p className="text-center text-sm text-neutral-400">
                Já possui uma conta?
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
