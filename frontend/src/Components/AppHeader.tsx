import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  LogIn,
  LogOut,
  UserRound,
} from "lucide-react";
import LogoOmnimarket from "../assets/Logo_omnimarket.jpg";
import {
  AUTH_CHANGED_EVENT,
  clearSession,
  getStoredUser,
  isAuthenticated,
  updateStoredUser,
} from "../Services/auth/session";
import { obterPerfilUsuario } from "../Services/user/usuarioService";

const menuItems = [
  {
    to: "/perfilUsuario",
    label: "Perfil",
    icon: UserRound,
  }
] as const;

export default function AppHeader() {
  const { location } = useRouterState();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const [autenticado, setAutenticado] = useState(() => isAuthenticated());
  const [nomeUsuario, setNomeUsuario] = useState(() => getStoredUser()?.nome ?? "");
  const [avatarUsuario, setAvatarUsuario] = useState(() => getStoredUser()?.avatarUrl ?? "");
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sincronizarAutenticacao = () => {
      const usuarioSessao = getStoredUser();
      setAutenticado(isAuthenticated());
      setNomeUsuario(usuarioSessao?.nome ?? "");
      setAvatarUsuario(usuarioSessao?.avatarUrl ?? "");
    };

    sincronizarAutenticacao();
    window.addEventListener(AUTH_CHANGED_EVENT, sincronizarAutenticacao);
    window.addEventListener("storage", sincronizarAutenticacao);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sincronizarAutenticacao);
      window.removeEventListener("storage", sincronizarAutenticacao);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function carregarAvatarAtual() {
      if (!autenticado) {
        return;
      }

      try {
        const perfil = await obterPerfilUsuario();

        if (!isMounted) {
          return;
        }

        const avatarAtual = perfil.avatarUrl ?? "";
        const nomeAtual = perfil.nome ?? "";
        setAvatarUsuario(avatarAtual);

        if (nomeAtual.trim()) {
          setNomeUsuario(nomeAtual);
        }

        const usuarioSessao = getStoredUser();

        if (
          usuarioSessao &&
          ((usuarioSessao.avatarUrl ?? "") !== avatarAtual ||
            usuarioSessao.nome !== (nomeAtual.trim() || usuarioSessao.nome))
        ) {
          updateStoredUser({
            ...usuarioSessao,
            nome: nomeAtual.trim() || usuarioSessao.nome,
            avatarUrl: avatarAtual || null,
          });
        }
      } catch {
        // O header pode continuar com os dados da sessao se a leitura do perfil falhar.
      }
    }

    void carregarAvatarAtual();

    return () => {
      isMounted = false;
    };
  }, [autenticado]);

  useEffect(() => {
    if (!menuAberto) {
      return undefined;
    }

    const handleClickFora = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    };

    window.addEventListener("mousedown", handleClickFora);

    return () => {
      window.removeEventListener("mousedown", handleClickFora);
    };
  }, [menuAberto]);

  function getNavItemClasses(isActive: boolean) {
    return `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
      isActive
        ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"
        : "border-white/10 bg-white/5 text-neutral-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
    }`;
  }

  function handleLogout() {
    setMenuAberto(false);
    clearSession();
    void navigate({ to: "/" });
  }

  function getNomeExibicao() {
    const primeiroNome = nomeUsuario.trim().split(/\s+/).filter(Boolean)[0];

    return primeiroNome || "Conta";
  }

  function getNomeCompleto() {
    return nomeUsuario.trim() || "Minha conta";
  }

  function getIniciaisUsuario() {
    const partesDoNome = nomeUsuario.trim().split(/\s+/).filter(Boolean);
    const primeiraParte = partesDoNome[0]?.[0] ?? "";
    const segundaParte = partesDoNome[1]?.[0] ?? "";

    return `${primeiraParte}${segundaParte}`.toUpperCase() || "MC";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Bloco da marca com logo e texto institucional. */}
          <Link
            to="/"
            className="flex items-center gap-4 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.02))] px-4 py-3 transition hover:border-yellow-400/30 hover:bg-white/10"
          >
            <img
              src={LogoOmnimarket}
              alt="Logo do OmniMarket"
              className="h-14 w-14 rounded-2xl object-cover hover:animate-spin hover:[animation-duration:2s]"
            />

            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-yellow-300">
                OmniMarket
              </p>
              <p className="text-sm text-neutral-400">
                Marketplace visual com tema dark
              </p>
            </div>
          </Link>

          
          {/* Navegacao principal com destaque para a rota atual. */}
          <nav className="flex flex-wrap items-center gap-2">
            {autenticado ? (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuAberto((currentState) => !currentState)}
                  className="flex min-w-[220px] items-center gap-4 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.02))] px-4 py-3 text-left transition hover:border-yellow-400/30 hover:bg-white/10"
                  aria-expanded={menuAberto}
                  aria-haspopup="menu"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-yellow-400/20 bg-black text-sm font-semibold text-yellow-300">
                    {avatarUsuario ? (
                      <img
                        src={avatarUsuario}
                        alt={`Avatar de ${getNomeCompleto()}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getIniciaisUsuario()
                    )}
                  </span>

                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block truncate text-sm font-semibold uppercase tracking-[0.24em] text-yellow-300">
                      {getNomeExibicao()}
                    </span>
                    <span className="block truncate text-sm text-neutral-400">
                      Perfil conectado
                    </span>
                  </span>

                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-neutral-300 transition ${menuAberto ? "rotate-180" : ""}`}
                  />
                </button>

                {menuAberto ? (
                  <div className="absolute right-0 top-full mt-3 w-56 rounded-3xl border border-white/10 bg-[#171717] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                    <div className="flex items-center gap-3 border-b border-white/10 px-3 py-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-yellow-400/20 bg-black text-xs font-semibold text-yellow-300">
                        {avatarUsuario ? (
                          <img
                            src={avatarUsuario}
                            alt={`Avatar de ${getNomeCompleto()}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getIniciaisUsuario()
                        )}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {getNomeCompleto()}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                          Navegacao rapida
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-col gap-1">
                      {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.to;

                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setMenuAberto(false)}
                            className={`inline-flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition ${
                              isActive
                                ? "bg-yellow-400/10 text-yellow-300"
                                : "text-neutral-200 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        );
                      })}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-red-200 transition hover:bg-red-400/10 hover:text-red-100"
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link to="/login" className={getNavItemClasses(pathname === "/login")}>
                <LogIn className="h-4 w-4" />
                Entrar
              </Link>
            )}
          </nav>
        </div>

        {/* Linha de contexto para manter o header mais informativo e alinhado com a Home nova. */}
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-neutral-500">
          <span>Home</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-neutral-300">
            {pathname === "/"
              ? "Vitrine principal"
              : pathname === "/login"
                ? "Entrada da conta"
                : pathname === "/cadastro"
                  ? "Criacao de conta"
                  : pathname === "/perfilUsuario"
                    ? "Perfil do usuario"
                    : "Pagina"}
          </span>
        </div>
      </div>
    </header>
  );
}
