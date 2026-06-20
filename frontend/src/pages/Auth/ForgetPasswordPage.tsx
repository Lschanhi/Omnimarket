import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { KeyRound, Mail, RefreshCw } from "lucide-react";
import { Botao } from "../../Components/Botao";
import { Input } from "../../Components/Input";
import { PageLayout } from "../../Components/PageLayout";
import {
  redefinirSenha,
  solicitarRedefinicaoSenha,
  validarTokenRedefinicaoSenha,
} from "../../Services/auth/authService";

type ForgetPasswordPageProps = {
  token: string;
};

type Feedback = {
  tone: "success" | "error" | "info";
  message: string;
};

type TokenStatus = "idle" | "loading" | "valid" | "invalid";

export function ForgetPasswordPage({ token }: ForgetPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({
    senha: "",
    confirmarSenha: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("idle");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [resetConcluido, setResetConcluido] = useState(false);

  const possuiToken = token.trim().length > 0;

  useEffect(() => {
    let ativo = true;

    if (!possuiToken) {
      setTokenStatus("idle");
      setResetConcluido(false);
      setFeedback(null);

      return () => {
        ativo = false;
      };
    }

    setTokenStatus("loading");
    setResetConcluido(false);
    setFeedback({
      tone: "info",
      message: "Estamos validando o link enviado para o seu e-mail.",
    });

    async function validarToken() {
      try {
        const resposta = await validarTokenRedefinicaoSenha(token);

        if (!ativo) {
          return;
        }

        setTokenStatus("valid");
        setFeedback({
          tone: "info",
          message: resposta.mensagem,
        });
      } catch (error) {
        if (!ativo) {
          return;
        }

        setTokenStatus("invalid");
        setFeedback({
          tone: "error",
          message:
            error instanceof Error
              ? error.message
              : "Nao foi possivel validar o link de redefinicao.",
        });
      }
    }

    void validarToken();

    return () => {
      ativo = false;
    };
  }, [possuiToken, token]);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setFeedback((prev) => (prev?.tone === "error" ? null : prev));
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);

    setErrors((prev) => ({
      ...prev,
      email: "",
    }));

    setFeedback((prev) => (prev?.tone === "error" ? null : prev));
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) return;

    const emailNormalizado = email.trim();

    if (!emailNormalizado) {
      setErrors((prev) => ({
        ...prev,
        email: "Informe o e-mail cadastrado.",
      }));
      return;
    }

    setIsLoading(true);

    try {
      const resposta = await solicitarRedefinicaoSenha(emailNormalizado);

      setFeedback({
        tone: "success",
        message: resposta.mensagem,
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel enviar o link de redefinicao agora.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading || tokenStatus !== "valid") return;

    const newErrors = {
      email: "",
      senha: "",
      confirmarSenha: "",
    };

    if (formData.senha.length < 6) {
      newErrors.senha = "A senha deve ter no minimo 6 caracteres.";
    }

    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = "As senhas nao coincidem.";
    }

    if (newErrors.senha || newErrors.confirmarSenha) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const resposta = await redefinirSenha(token, formData.senha, formData.confirmarSenha);

      setResetConcluido(true);
      setFormData({
        senha: "",
        confirmarSenha: "",
      });
      setFeedback({
        tone: "success",
        message: resposta.mensagem,
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel redefinir a senha agora.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const tituloPagina = possuiToken ? "Redefina sua senha" : "Recupere o acesso";
  const descricaoPagina = possuiToken
    ? "Use o link recebido por e-mail para definir uma nova senha com seguranca."
    : "Informe o e-mail da sua conta para receber um link de redefinicao dentro do sistema.";
  const tituloFormulario = possuiToken ? "Nova senha" : "Enviar link por e-mail";
  const descricaoFormulario = possuiToken
    ? "Digite e confirme sua nova senha para concluir a recuperacao."
    : "Usaremos o e-mail cadastrado para enviar um link seguro de redefinicao.";

  const feedbackClassName = feedback
    ? feedback.tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
      : feedback.tone === "error"
        ? "border-red-500/20 bg-red-500/10 text-red-100"
        : "border-yellow-400/20 bg-yellow-400/10 text-yellow-100"
    : "";

  return (
    <PageLayout>
      <div className="flex min-h-[calc(100vh-106px)] w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_transparent_45%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))] px-4 py-8 sm:px-6">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#080808] shadow-[0_24px_80px_rgba(0,0,0,0.45)] lg:grid-cols-[1fr_0.95fr]">
          <section className="flex flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1 text-sm font-medium text-yellow-300">
                Seguranca da conta
              </span>

              <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {tituloPagina}
                </h1>
                <p className="max-w-xl text-sm leading-6 text-neutral-300 sm:text-base">
                  {descricaoPagina}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">E-mail seguro</p>
                <p className="mt-1 text-sm text-neutral-400">
                  O link de recuperacao e enviado apenas para o endereco cadastrado.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Nova senha</p>
                <p className="mt-1 text-sm text-neutral-400">
                  Escolha uma senha forte e confirme o mesmo valor para concluir.
                </p>
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-5">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                  {tituloFormulario}
                </h2>
                <p className="text-sm text-neutral-400">
                  {descricaoFormulario}
                </p>
              </div>

              {feedback ? (
                <div className={`rounded-3xl border p-4 text-sm leading-6 ${feedbackClassName}`.trim()}>
                  {feedback.message}
                </div>
              ) : null}

              {!possuiToken ? (
                <form className="flex flex-col gap-5" onSubmit={handleEmailSubmit}>
                  <Input
                    label="E-mail"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChange={handleEmailChange}
                    error={errors.email}
                    icon={<Mail className="h-5 w-5" />}
                  />

                  <Botao
                    type="submit"
                    disabled={isLoading}
                    className="h-12 text-sm font-semibold sm:text-base"
                  >
                    {isLoading ? "Enviando..." : "Enviar link de redefinicao"}
                  </Botao>
                </form>
              ) : tokenStatus === "loading" ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-neutral-300">
                  Aguarde alguns instantes enquanto validamos o seu link.
                </div>
              ) : tokenStatus === "invalid" ? (
                <div className="flex flex-col gap-3">
                  <Link
                    to="/recuperarSenha"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-yellow-500 px-6 text-sm font-semibold text-black transition hover:bg-yellow-300"
                  >
                    Solicitar novo link
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
                  >
                    Voltar ao login
                  </Link>
                </div>
              ) : resetConcluido ? (
                <div className="flex flex-col gap-3">
                  <Link
                    to="/login"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-yellow-500 px-6 text-sm font-semibold text-black transition hover:bg-yellow-300"
                  >
                    Entrar na plataforma
                  </Link>
                  <Link
                    to="/recuperarSenha"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
                  >
                    Enviar novo link
                  </Link>
                </div>
              ) : (
                <form className="flex flex-col gap-5" onSubmit={handlePasswordSubmit}>
                  <Input
                    label="Nova senha"
                    id="senha"
                    name="senha"
                    type="password"
                    placeholder="Digite sua nova senha"
                    value={formData.senha}
                    onChange={handleInputChange}
                    error={errors.senha}
                    icon={<KeyRound className="h-5 w-5" />}
                  />

                  <Input
                    label="Confirmar senha"
                    id="confirmarSenha"
                    name="confirmarSenha"
                    type="password"
                    placeholder="Repita sua nova senha"
                    value={formData.confirmarSenha}
                    onChange={handleInputChange}
                    error={errors.confirmarSenha}
                    icon={<RefreshCw className="h-5 w-5" />}
                  />

                  <Botao
                    type="submit"
                    disabled={isLoading}
                    className="h-12 text-sm font-semibold sm:text-base"
                  >
                    {isLoading ? "Salvando..." : "Alterar senha"}
                  </Botao>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
