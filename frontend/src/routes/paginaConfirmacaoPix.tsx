import { createFileRoute } from "@tanstack/react-router";
import { ConfirmacaoPixPage } from "../pages/Pedido/ConfirmacaoPixPage";

export const Route = createFileRoute("/paginaConfirmacaoPix")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ConfirmacaoPixPage />;
}
