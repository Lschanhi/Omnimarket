import { createFileRoute } from "@tanstack/react-router";
import { LojaPublicaPage } from "../../pages/Loja/LojaPublicaPage";

export const Route = createFileRoute("/loja/$id")({
  component: LojaPublicaPage,
});
