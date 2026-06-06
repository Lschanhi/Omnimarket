import { ArrowRight, CheckCheck, Clock3, PackageCheck, PackageSearch, Truck } from "lucide-react";
import type { PerfilVendaStatusItem } from "../../../types/perfil";

type FluxoStatusVendasProps = {
  itens: PerfilVendaStatusItem[];
};

const iconesPorStatus = {
  pendente: Clock3,
  "em-separacao": PackageSearch,
  pronto: PackageCheck,
  enviado: Truck,
  finalizado: CheckCheck,
} satisfies Record<PerfilVendaStatusItem["key"], typeof PackageSearch>;

export function FluxoStatusVendas({ itens }: FluxoStatusVendasProps) {
  const totalPedidosMonitorados = itens.reduce((acumulador, item) => acumulador + item.total, 0);

  return (
    <div className="rounded-3xl border border-yellow-400/15 bg-[linear-gradient(180deg,rgba(250,204,21,0.08),rgba(255,255,255,0.02))] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-yellow-300">Fluxo da venda</p>
          <h3 className="text-lg font-semibold text-white">
            Totais por etapa operacional da sua loja
          </h3>
          <p className="max-w-3xl text-sm text-neutral-400">
            Acompanhe as vendas pendentes, em separacao, prontas, enviadas e concluidas usando os
            totais que a API de metricas entrega para a loja.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">Pedidos no fluxo</p>
          <p className="mt-2 text-2xl font-semibold text-white">{totalPedidosMonitorados}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-[repeat(5,minmax(0,1fr))]">
        {itens.map((item, index) => {
          const Icone = iconesPorStatus[item.key];
          const isUltimo = index === itens.length - 1;

          return (
            <div key={item.key} className="flex items-stretch gap-3">
              <article className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/35 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                      Etapa {index + 1}
                    </p>
                    <h4 className="text-base font-semibold text-white">{item.label}</h4>
                  </div>

                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-300">
                    <Icone className="h-5 w-5" />
                  </span>
                </div>

                <p className="mt-4 text-3xl font-semibold text-yellow-300">{item.total}</p>
                <p className="mt-2 text-sm leading-6 text-neutral-400">{item.descricao}</p>
              </article>

              {!isUltimo ? (
                <div className="hidden items-center justify-center xl:flex">
                  <ArrowRight className="h-5 w-5 text-neutral-600" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-neutral-400">
        O painel resume as etapas do fluxo da loja e complementa a gestao individual de pedidos na
        aba de vendas.
      </p>
    </div>
  );
}
