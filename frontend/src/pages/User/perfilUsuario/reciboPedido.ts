import type { PerfilPedidoDetalhe, PerfilPedidoItem } from "../../../types/perfil";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatarTexto(valor?: string | null, fallback = "Nao informado") {
  const texto = valor?.trim();
  return escapeHtml(texto || fallback);
}

function formatarTextoMultilinha(valor?: string | null, fallback = "Nao informado") {
  return formatarTexto(valor, fallback).replace(/\n/g, "<br />");
}

function obterResumoLojas(itens: PerfilPedidoItem[]) {
  const lojas = Array.from(
    new Set(itens.map((item) => item.nomeLoja.trim()).filter(Boolean)),
  );

  return lojas.length > 0 ? lojas.join(", ") : "Nao informado";
}

function montarLinhasItens(itens: PerfilPedidoItem[]) {
  return itens
    .map(
      (item) => `
        <tr>
          <td>
            <strong>${formatarTexto(item.nomeProduto)}</strong>
            <span class="item-store">${formatarTexto(item.nomeLoja)}</span>
          </td>
          <td>${item.quantidade}x</td>
          <td>${formatarTexto(item.precoUnitario)}</td>
          <td>${formatarTexto(item.valorTotal)}</td>
        </tr>
      `,
    )
    .join("");
}

function criarConteudoRecibo(pedido: PerfilPedidoDetalhe) {
  const dataGeracao = dateTimeFormatter.format(new Date());
  const resumoLojas = formatarTexto(obterResumoLojas(pedido.itens));
  const observacao =
    pedido.observacao.trim() && pedido.observacao !== "Sem observacoes adicionais informadas para este pedido."
      ? formatarTextoMultilinha(pedido.observacao)
      : "Sem observacoes adicionais.";

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Recibo do pedido #${pedido.pedidoId}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f5f5;
        --surface: #ffffff;
        --text: #0f172a;
        --muted: #475569;
        --line: #d4d4d8;
        --accent: #f59e0b;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.5;
      }

      .page {
        width: min(920px, 100%);
        margin: 0 auto;
        padding: 32px 20px 40px;
      }

      .receipt {
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 24px;
        background: var(--surface);
        box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
      }

      .hero {
        padding: 28px;
        background: linear-gradient(135deg, #111827, #1f2937);
        color: #f8fafc;
      }

      .badge {
        display: inline-block;
        margin-bottom: 10px;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(245, 158, 11, 0.16);
        color: #fde68a;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .hero h1 {
        margin: 0;
        font-size: 28px;
      }

      .hero p {
        margin: 10px 0 0;
        color: #cbd5e1;
      }

      .content {
        padding: 28px;
      }

      .grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .card {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 18px;
        background: #fff;
      }

      .card h2,
      .section-title {
        margin: 0 0 12px;
        font-size: 15px;
      }

      .eyebrow {
        display: block;
        margin-bottom: 6px;
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .value {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
      }

      .section {
        margin-top: 24px;
      }

      .info-list {
        display: grid;
        gap: 12px;
      }

      .info-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .info-label {
        color: var(--muted);
        font-weight: 600;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      thead th {
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-align: left;
        text-transform: uppercase;
      }

      th,
      td {
        padding: 14px 0;
        border-bottom: 1px solid var(--line);
        vertical-align: top;
      }

      td:nth-child(2),
      td:nth-child(3),
      td:nth-child(4),
      th:nth-child(2),
      th:nth-child(3),
      th:nth-child(4) {
        width: 110px;
        text-align: right;
      }

      .item-store {
        display: block;
        margin-top: 4px;
        color: var(--muted);
        font-size: 13px;
      }

      .totals {
        margin-top: 18px;
        margin-left: auto;
        width: min(320px, 100%);
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 18px;
      }

      .totals-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .totals-row + .totals-row {
        margin-top: 12px;
      }

      .totals-row.total {
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid var(--line);
        font-size: 18px;
        font-weight: 700;
      }

      .footer-note {
        margin-top: 24px;
        color: var(--muted);
        font-size: 13px;
      }

      @media (max-width: 720px) {
        .grid {
          grid-template-columns: 1fr;
        }

        td:nth-child(2),
        td:nth-child(3),
        td:nth-child(4),
        th:nth-child(2),
        th:nth-child(3),
        th:nth-child(4) {
          width: auto;
        }
      }

      @media print {
        body {
          background: #fff;
        }

        .page {
          width: 100%;
          padding: 0;
        }

        .receipt {
          border: 0;
          border-radius: 0;
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="receipt">
        <header class="hero">
          <span class="badge">Omnimarket</span>
          <h1>Recibo da compra</h1>
          <p>Pedido #${pedido.pedidoId} gerado em ${escapeHtml(dataGeracao)}.</p>
        </header>

        <div class="content">
          <section class="grid">
            <article class="card">
              <span class="eyebrow">Status</span>
              <p class="value">${formatarTexto(pedido.status)}</p>
            </article>

            <article class="card">
              <span class="eyebrow">Data do pedido</span>
              <p class="value">${formatarTexto(pedido.dataPedido)}</p>
            </article>

            <article class="card">
              <span class="eyebrow">Tipo de entrega</span>
              <p class="value">${formatarTexto(pedido.tipoEntrega)}</p>
            </article>

            <article class="card">
              <span class="eyebrow">Lojas</span>
              <p class="value">${resumoLojas}</p>
            </article>
          </section>

          <section class="section">
            <h2 class="section-title">Entrega e observacoes</h2>
            <div class="grid">
              <article class="card">
                <div class="info-list">
                  <div>
                    <span class="eyebrow">Endereco</span>
                    <p>${formatarTextoMultilinha(pedido.enderecoEntrega)}</p>
                  </div>
                </div>
              </article>

              <article class="card">
                <div class="info-list">
                  <div>
                    <span class="eyebrow">Observacao</span>
                    <p>${observacao}</p>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section class="section">
            <h2 class="section-title">Itens do pedido</h2>
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Qtd.</th>
                  <th>Unitario</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${montarLinhasItens(pedido.itens)}
              </tbody>
            </table>

            <div class="totals">
              <div class="totals-row">
                <span>Subtotal</span>
                <strong>${formatarTexto(pedido.subtotal)}</strong>
              </div>
              <div class="totals-row">
                <span>Frete</span>
                <strong>${formatarTexto(pedido.frete)}</strong>
              </div>
              <div class="totals-row total">
                <span>Total do pedido</span>
                <strong>${formatarTexto(pedido.total)}</strong>
              </div>
            </div>
          </section>

          <p class="footer-note">
            Este recibo foi gerado automaticamente no painel do comprador para consulta,
            download e impressao.
          </p>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

export function baixarReciboPedido(pedido: PerfilPedidoDetalhe) {
  const conteudo = criarConteudoRecibo(pedido);
  const blob = new Blob([conteudo], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `recibo-pedido-${pedido.pedidoId}.html`;
  anchor.rel = "noopener";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
