import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { Spotlight } from "../../Components/home/SpotLight";
import { PageLayout } from "../../Components/PageLayout";
import { ProfileFeedback } from "../../Components/perfil/ProfileFeedback";
import { ProfileSection } from "../../Components/perfil/ProfileSection";
import { UserStats } from "../../Components/perfil/UserStats";
import {
  obterDashboardAdmin,
  type AdminDashboardApiResponse,
  type AdminRankingLojaApiResponse,
  type AdminRankingProdutoApiResponse,
  type AdminSerieDiariaApiResponse,
  type AdminStatusResumoApiResponse,
} from "../../Services/admin/adminService";
import { AUTH_CHANGED_EVENT, getStoredUser } from "../../Services/auth/session";
import type { PerfilStatCardItem } from "../../types/perfil";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

const DISTRIBUTION_COLORS = [
  "#facc15",
  "#f59e0b",
  "#38bdf8",
  "#34d399",
  "#f87171",
  "#a78bfa",
  "#fb7185",
  "#60a5fa",
];

function formatCurrency(value: number) {
  return currencyFormatter.format(Number(value ?? 0));
}

function formatNumber(value: number) {
  return numberFormatter.format(Number(value ?? 0));
}

function createAdminStats(dashboard: AdminDashboardApiResponse): PerfilStatCardItem[] {
  return [
    {
      key: "usuarios",
      label: "Usuarios cadastrados",
      value: formatNumber(dashboard.totalUsuarios),
    },
    {
      key: "lojas-ativas",
      label: "Lojas ativas",
      value: `${formatNumber(dashboard.totalLojasAtivas)} / ${formatNumber(dashboard.totalLojas)}`,
    },
    {
      key: "produtos-publicados",
      label: "Produtos publicados",
      value: `${formatNumber(dashboard.produtosPublicados)} / ${formatNumber(dashboard.totalProdutos)}`,
    },
    {
      key: "pedidos",
      label: "Pedidos totais",
      value: formatNumber(dashboard.totalPedidos),
    },
    {
      key: "gmv",
      label: "Volume bruto",
      value: formatCurrency(dashboard.receitaTotalMarketplace),
    },
    {
      key: "comissao",
      label: "Comissao marketplace",
      value: formatCurrency(dashboard.comissaoTotalMarketplace),
    },
    {
      key: "ticket",
      label: "Ticket medio",
      value: formatCurrency(dashboard.ticketMedioPedidos),
    },
    {
      key: "acessos",
      label: "Visualizacoes registradas",
      value: formatNumber(dashboard.totalAcessosCatalogo),
    },
  ];
}

function createOperationalStats(dashboard: AdminDashboardApiResponse): PerfilStatCardItem[] {
  return [
    {
      key: "admins",
      label: "Admins ativos",
      value: formatNumber(dashboard.totalAdmins),
    },
    {
      key: "pendentes",
      label: "Pedidos pendentes",
      value: formatNumber(dashboard.pedidosPendentes),
    },
    {
      key: "pagos",
      label: "Pedidos pagos",
      value: formatNumber(dashboard.pedidosPagos),
    },
    {
      key: "views-lojas",
      label: "Views de lojas",
      value: formatNumber(dashboard.totalVisualizacoesLojas),
    },
    {
      key: "views-produtos",
      label: "Views de produtos",
      value: formatNumber(dashboard.totalVisualizacoesProdutos),
    },
  ];
}

function LoadingPanel() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="h-80 animate-pulse rounded-3xl border border-white/10 bg-[#111]"
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="h-96 animate-pulse rounded-3xl border border-white/10 bg-[#111]"
          />
        ))}
      </div>
    </div>
  );
}

function DailyBarChart({
  title,
  description,
  items,
  mode,
}: {
  title: string;
  description: string;
  items: AdminSerieDiariaApiResponse[];
  mode: "currency" | "count";
}) {
  const maxValue = Math.max(
    ...items.map((item) => (mode === "currency" ? item.valor : item.total)),
    1,
  );

  return (
    <ProfileSection title={title} description={description}>
      <div className="flex min-h-[260px] items-end gap-3">
        {items.map((item) => {
          const rawValue = mode === "currency" ? item.valor : item.total;
          const height = Math.max((rawValue / maxValue) * 100, rawValue > 0 ? 12 : 4);
          const label = mode === "currency" ? formatCurrency(rawValue) : formatNumber(rawValue);

          return (
            <div key={item.data} className="flex flex-1 flex-col items-center gap-3">
              <span className="text-center text-[11px] text-neutral-400">{label}</span>
              <div className="flex h-44 w-full items-end rounded-2xl border border-white/10 bg-black/40 p-2">
                <div
                  className="w-full rounded-xl"
                  style={{
                    height: `${height}%`,
                    background:
                      mode === "currency"
                        ? "linear-gradient(180deg, rgba(250,204,21,0.95), rgba(245,158,11,0.72))"
                        : "linear-gradient(180deg, rgba(56,189,248,0.95), rgba(59,130,246,0.72))",
                  }}
                />
              </div>
              <span className="text-xs font-medium text-white">{item.label}</span>
            </div>
          );
        })}
      </div>
    </ProfileSection>
  );
}

function StatusDistributionPanel({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: AdminStatusResumoApiResponse[];
}) {
  const total = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <ProfileSection title={title} description={description}>
      {items.length === 0 ? (
        <ProfileFeedback
          variant="empty"
          title="Sem movimentacao"
          description="Nao ha dados suficientes para montar a distribuicao deste bloco."
        />
      ) : (
        <div className="space-y-5">
          <div className="flex h-4 overflow-hidden rounded-full border border-white/10 bg-black/50">
            {items.map((item, index) => {
              const width = total > 0 ? `${(item.total / total) * 100}%` : "0%";

              return (
                <div
                  key={item.chave}
                  style={{
                    width,
                    backgroundColor: DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length],
                  }}
                />
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item, index) => {
              const percentage = total > 0 ? (item.total / total) * 100 : 0;

              return (
                <div
                  key={item.chave}
                  className="rounded-2xl border border-white/8 bg-black/35 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length],
                        }}
                      />
                      <p className="text-sm font-medium text-white">{item.label}</p>
                    </div>
                    <span className="text-sm text-neutral-400">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-2xl font-semibold text-white">{formatNumber(item.total)}</p>
                    <p className="text-sm text-neutral-400">{formatCurrency(item.valorTotal)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ProfileSection>
  );
}

function RankingProdutosPanel({
  title,
  description,
  items,
  metric,
}: {
  title: string;
  description: string;
  items: AdminRankingProdutoApiResponse[];
  metric: "quantidade" | "visualizacoes";
}) {
  const maxValue = Math.max(
    ...items.map((item) =>
      metric === "quantidade" ? item.totalQuantidade : item.totalVisualizacoes,
    ),
    1,
  );

  return (
    <ProfileSection title={title} description={description}>
      {items.length === 0 ? (
        <ProfileFeedback
          variant="empty"
          title="Nada para ranquear"
          description="Assim que houver vendas ou visualizacoes registradas, este ranking sera preenchido."
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const rawValue =
              metric === "quantidade" ? item.totalQuantidade : item.totalVisualizacoes;
            const width = `${Math.max((rawValue / maxValue) * 100, rawValue > 0 ? 10 : 0)}%`;

            return (
              <div key={`${metric}-${item.produtoId}`} className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.nome}</p>
                    <p className="text-xs text-neutral-400">{item.nomeLoja}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-yellow-300">
                      {metric === "quantidade"
                        ? `${formatNumber(item.totalQuantidade)} un`
                        : formatNumber(item.totalVisualizacoes)}
                    </p>
                    <p className="text-xs text-neutral-500">{formatCurrency(item.valorTotal)}</p>
                  </div>
                </div>
                <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-black/45">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width,
                      background:
                        metric === "quantidade"
                          ? "linear-gradient(90deg, rgba(250,204,21,0.95), rgba(245,158,11,0.72))"
                          : "linear-gradient(90deg, rgba(56,189,248,0.95), rgba(59,130,246,0.72))",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ProfileSection>
  );
}

function RankingLojasPanel({
  title,
  description,
  items,
  metric,
}: {
  title: string;
  description: string;
  items: AdminRankingLojaApiResponse[];
  metric: "receita" | "visualizacoes";
}) {
  const maxValue = Math.max(
    ...items.map((item) =>
      metric === "receita" ? item.valorBruto : item.totalVisualizacoes,
    ),
    1,
  );

  return (
    <ProfileSection title={title} description={description}>
      {items.length === 0 ? (
        <ProfileFeedback
          variant="empty"
          title="Sem destaque de lojas"
          description="As lojas aparecem aqui assim que acumularem receita ou visualizacoes registradas."
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const rawValue = metric === "receita" ? item.valorBruto : item.totalVisualizacoes;
            const width = `${Math.max((rawValue / maxValue) * 100, rawValue > 0 ? 10 : 0)}%`;

            return (
              <div key={`${metric}-${item.lojaId}`} className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.nomeFantasia}</p>
                    <p className="text-xs text-neutral-400">
                      {item.ativa ? "Loja ativa" : "Loja inativa"} •{" "}
                      {formatNumber(item.totalProdutosPublicados)} produtos publicados
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-yellow-300">
                      {metric === "receita"
                        ? formatCurrency(item.valorBruto)
                        : formatNumber(item.totalVisualizacoes)}
                    </p>
                  </div>
                </div>
                <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-black/45">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width,
                      background:
                        metric === "receita"
                          ? "linear-gradient(90deg, rgba(52,211,153,0.95), rgba(16,185,129,0.72))"
                          : "linear-gradient(90deg, rgba(167,139,250,0.95), rgba(99,102,241,0.72))",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ProfileSection>
  );
}

export function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const usuarioSessao = getStoredUser();

  useEffect(() => {
    let ativo = true;

    async function carregarDashboard() {
      try {
        setIsLoading(true);
        setError("");
        const resposta = await obterDashboardAdmin();

        if (!ativo) {
          return;
        }

        setDashboard(resposta);
      } catch (currentError) {
        if (!ativo) {
          return;
        }

        setError(
          currentError instanceof Error
            ? currentError.message
            : "Nao foi possivel carregar o painel administrativo.",
        );
      } finally {
        if (ativo) {
          setIsLoading(false);
        }
      }
    }

    void carregarDashboard();

    const handleAuthChange = () => {
      void carregarDashboard();
    };

    if (typeof window !== "undefined") {
      window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    }

    return () => {
      ativo = false;
      if (typeof window !== "undefined") {
        window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
      }
    };
  }, []);

  const adminStats = useMemo(
    () => (dashboard ? createAdminStats(dashboard) : []),
    [dashboard],
  );
  const operationalStats = useMemo(
    () => (dashboard ? createOperationalStats(dashboard) : []),
    [dashboard],
  );

  return (
    <PageLayout>
      <div className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <Spotlight>
            <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.14),_transparent_42%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-4">
                  <span className="inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1 text-sm font-medium text-yellow-300">
                    Painel administrativo
                  </span>
                  <div className="space-y-3">
                    <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                      Visao geral do marketplace
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-neutral-300 sm:text-base">
                      Acompanhe o volume de pedidos, o valor movimentado, os acessos
                      registrados em lojas e produtos e os principais rankings do
                      OmniMarket em um unico painel.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">
                      Sessao
                    </p>
                    <p className="mt-3 text-lg font-semibold text-white">
                      {usuarioSessao?.nome ?? "Admin"}
                    </p>
                    <p className="text-sm text-neutral-400">
                      {usuarioSessao?.email ?? "admin@omnimarket"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">
                      Leitura de acessos
                    </p>
                    <p className="mt-3 text-sm leading-6 text-neutral-300">
                      O painel usa as visualizacoes salvas pela API para lojas e
                      produtos. Ainda nao ha analytics de navegacao anonima.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </Spotlight>

          {isLoading ? <LoadingPanel /> : null}

          {!isLoading && error ? (
            <ProfileSection>
              <ProfileFeedback
                variant="error"
                title="Erro ao carregar o painel admin"
                description={error}
              />
            </ProfileSection>
          ) : null}

          {!isLoading && dashboard ? (
            <>
              <UserStats
                title="Saude do marketplace"
                description="Indicadores principais para acompanhar vendas, base cadastrada e alcance do catalogo."
                stats={adminStats}
              />

              <UserStats
                title="Operacao e acesso"
                description="Indicadores complementares para entender o ritmo operacional do painel."
                stats={operationalStats}
              />

              <div className="grid gap-4 lg:grid-cols-2">
                <DailyBarChart
                  title="Receita nos ultimos 7 dias"
                  description="Volume bruto de vendas registrado diariamente no marketplace."
                  items={dashboard.receitaPorDia}
                  mode="currency"
                />
                <DailyBarChart
                  title="Pedidos nos ultimos 7 dias"
                  description="Quantidade de pedidos criados por dia no mesmo intervalo."
                  items={dashboard.pedidosPorDia}
                  mode="count"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <StatusDistributionPanel
                  title="Pedidos por status"
                  description="Distribuicao do funil de pedidos da plataforma."
                  items={dashboard.pedidosPorStatus}
                />
                <StatusDistributionPanel
                  title="Vendas por status"
                  description="Distribuicao operacional das vendas entre as etapas da plataforma."
                  items={dashboard.vendasPorStatus}
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <RankingProdutosPanel
                  title="Produtos mais vendidos"
                  description="Ranking por quantidade vendida, com o valor total acumulado no periodo armazenado."
                  items={dashboard.produtosMaisVendidos}
                  metric="quantidade"
                />
                <RankingProdutosPanel
                  title="Produtos mais visualizados"
                  description="Produtos com maior interesse registrado no catalogo."
                  items={dashboard.produtosMaisVisualizados}
                  metric="visualizacoes"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <RankingLojasPanel
                  title="Lojas com maior receita"
                  description="Lojas que mais movimentaram vendas no marketplace."
                  items={dashboard.lojasComMaiorReceita}
                  metric="receita"
                />
                <RankingLojasPanel
                  title="Lojas mais visitadas"
                  description="Lojas com maior volume de visualizacoes registradas."
                  items={dashboard.lojasMaisVisitadas}
                  metric="visualizacoes"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    key: "usuarios",
                    icon: Users,
                    title: "Base de usuarios",
                    value: formatNumber(dashboard.totalUsuarios),
                    description: "Contas cadastradas no marketplace.",
                  },
                  {
                    key: "lojas",
                    icon: Store,
                    title: "Lojas no ar",
                    value: formatNumber(dashboard.totalLojasAtivas),
                    description: "Lojas ativas prontas para vender.",
                  },
                  {
                    key: "pedidos",
                    icon: ShoppingBag,
                    title: "Pedidos pagos",
                    value: formatNumber(dashboard.pedidosPagos),
                    description: "Pedidos em fluxo pago, enviado ou entregue.",
                  },
                  {
                    key: "analytics",
                    icon: Activity,
                    title: "Acessos rastreados",
                    value: formatNumber(dashboard.totalAcessosCatalogo),
                    description: "Soma das visualizacoes de lojas e produtos.",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <ProfileSection key={item.key} className="h-full">
                      <div className="space-y-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-300">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-neutral-400">{item.title}</p>
                          <p className="text-2xl font-semibold text-white">{item.value}</p>
                        </div>
                        <p className="text-sm leading-6 text-neutral-400">{item.description}</p>
                      </div>
                    </ProfileSection>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </PageLayout>
  );
}
