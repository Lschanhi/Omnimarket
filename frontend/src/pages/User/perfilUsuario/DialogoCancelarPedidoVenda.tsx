import { MessageSquareWarning } from "lucide-react";
import { Botao } from "../../../Components/Botao";
import { ProfileModal } from "../../../Components/perfil/ProfileModal";
import type { PerfilPedidoDetalhe } from "../../../types/perfil";

type DialogoCancelarPedidoVendaProps = {
  isOpen: boolean;
  isProcessando?: boolean;
  pedido: PerfilPedidoDetalhe | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function DialogoCancelarPedidoVenda({
  isOpen,
  isProcessando = false,
  pedido,
  onClose,
  onConfirm,
}: DialogoCancelarPedidoVendaProps) {
  return (
    <ProfileModal
      isOpen={isOpen}
      title={pedido ? `Cancelar pedido #${pedido.pedidoId}` : "Cancelar pedido"}
      description="Confirme o cancelamento da venda conforme as regras liberadas pela API da loja."
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
          <div className="flex items-start gap-3">
            <MessageSquareWarning className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="space-y-2">
              <p>Essa acao atualiza a venda para `Cancelada` no backend da loja.</p>
              <p>
                A API atual ainda nao recebe justificativa do vendedor, entao o cancelamento sera
                salvo sem observacao adicional.
              </p>
            </div>
          </div>
        </div>

        {pedido?.pedidoMultiloja ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-neutral-300">
            Este pedido possui itens de outras lojas. O backend bloqueia cancelamento parcial por
            vendedor, por isso esse fluxo so pode ser usado em pedidos de loja unica.
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Botao type="button" variant="secondary" onClick={onClose} disabled={isProcessando}>
            Voltar
          </Botao>
          <Botao type="button" onClick={onConfirm} disabled={isProcessando}>
            {isProcessando ? "Cancelando..." : "Confirmar cancelamento"}
          </Botao>
        </div>
      </div>
    </ProfileModal>
  );
}
