import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PageLayout } from "../../Components/PageLayout";
import { confirmarEmail } from "../../Services/auth/authService";

type ConfirmarEmailPageProps = {
  token: string;
};

type StatusConfirmacao = "carregando" | "sucesso" | "erro";

export function ConfirmarEmailPage({ token }: ConfirmarEmailPageProps) {
  const [status, setStatus] = useState<StatusConfirmacao>("carregando");
  const [mensagem, setMensagem] = useState("Estamos validando o link de confirmacao.");

  useEffect(() => {
    let ativo = true;

    async function executarConfirmacao() {
      if (!token.trim()) {
        if (ativo) {
          setStatus("erro");
          setMensagem("O link de confirmacao esta incompleto ou nao foi informado.");
        }

        return;
      }

      try {
        const resposta = await confirmarEmail(token);

        if (!ativo) {
          return;
        }

        setStatus("sucesso");
        setMensagem(resposta.mensagem);
      } catch (error) {
        if (!ativo) {
          return;
        }

        setStatus("erro");
        setMensagem(
          error instanceof Error
            ? error.message
            : "Nao foi possivel confirmar o email agora.",
        );
      }
    }

    void executarConfirmacao();

    return () => {
      ativo = false;
    };
  }, [token]);

  const cardTone =
    status === "sucesso"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
      : status === "erro"
        ? "border-red-500/20 bg-red-500/10 text-red-100"
        : "border-yellow-400/20 bg-yellow-400/10 text-yellow-100";

  const titulo =
    status === "sucesso"
      ? "Email confirmado"
      : status === "erro"
        ? "Nao foi possivel confirmar"
        : "Confirmando email";

  const descricao =
    status === "sucesso"
      ? "Sua conta ja pode entrar na plataforma com email e senha."
      : status === "erro"
        ? "Revise o link recebido no email ou solicite um novo envio na tela de login."
        : "Aguarde alguns instantes enquanto validamos o token enviado para sua conta.";

  return (
    <PageLayout>
      <div className="flex min-h-[calc(100vh-106px)] w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_transparent_45%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))] px-4 py-8 sm:px-6">
        <div className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-[#080808] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <section className="space-y-6 p-6 sm:p-8 lg:p-10">
            <span className="inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1 text-sm font-medium text-yellow-300">
              Confirmacao de conta
            </span>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {titulo}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-neutral-300 sm:text-base">
                {descricao}
              </p>
            </div>

            <div className={`rounded-3xl border p-5 text-sm leading-6 ${cardTone}`.trim()}>
              {mensagem}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-yellow-500 px-6 text-sm font-semibold text-black transition hover:bg-yellow-300"
              >
                Ir para login
              </Link>

              <Link
                to="/cadastro"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
              >
                Voltar ao cadastro
              </Link>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
