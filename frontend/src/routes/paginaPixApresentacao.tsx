import { createFileRoute } from "@tanstack/react-router";
import { PixApresentacaoPage } from "../pages/Pedido/PixApresentacaoPage";

export const Route = createFileRoute("/paginaPixApresentacao")({
  component: RouteComponent,
});

function RouteComponent() {
  return <PixApresentacaoPage />;
}
