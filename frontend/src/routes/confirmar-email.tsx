import { createFileRoute } from "@tanstack/react-router";
import { ConfirmarEmailPage } from "../pages/Auth/ConfirmarEmailPage";

type ConfirmarEmailSearch = {
  token?: string;
};

export const Route = createFileRoute("/confirmar-email")({
  validateSearch: (search: Record<string, unknown>): ConfirmarEmailSearch => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { token = "" } = Route.useSearch();

  return <ConfirmarEmailPage token={token} />;
}
