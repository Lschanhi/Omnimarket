import { createFileRoute } from "@tanstack/react-router";
import { ForgetPasswordPage } from "../pages/Auth/ForgetPasswordPage";

type RecuperarSenhaSearch = {
  token?: string;
};

export const Route = createFileRoute('/recuperarSenha')({
  validateSearch: (search: Record<string, unknown>): RecuperarSenhaSearch => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { token = "" } = Route.useSearch();

  return <ForgetPasswordPage token={token} />;
}
