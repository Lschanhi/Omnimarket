import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";
import AppHeader from "../Components/AppHeader";
import Footer from "../Components/Footer";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const urlAtual = useLocation();
  const esconderFooter = ["/login", "/cadastro", "/recuperarSenha", "/confirmar-email"].includes(
    urlAtual.pathname,
  );

  return (
    <>
      <AppHeader />
      <Outlet />
      {!esconderFooter ? <Footer /> : null}
    </>
  );
}
