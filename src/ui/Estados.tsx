import { RotateCcw, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Botao } from "./Botao";

/** Esqueleto exibido enquanto os dados chegam do Firestore. */
export function Carregando({ linhas = 6 }: { linhas?: number }) {
  return (
    <div role="status" aria-live="polite" className="py-8">
      <span className="sr-only">Carregando os dados da edição…</span>
      <div className="mb-6 h-10 w-2/3 max-w-md animate-pulse rounded bg-gramado" />
      <div className="space-y-3">
        {Array.from({ length: linhas }, (_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-gramado" />
        ))}
      </div>
    </div>
  );
}

export function MensagemErro({ erro, tentarDeNovo }: { erro: Error; tentarDeNovo?: () => void }) {
  return (
    <div role="alert" className="my-8 rounded-md border border-campea/30 bg-campea/5 p-5">
      <p className="flex items-center gap-2 font-semibold text-campea">
        <TriangleAlert aria-hidden className="size-5" />
        Não foi possível carregar esta página.
      </p>
      <p className="mt-1 text-tinta-suave">{erro.message}</p>
      {tentarDeNovo && (
        <Botao variante="secundario" className="mt-4" onClick={tentarDeNovo}>
          <RotateCcw aria-hidden className="size-4" />
          Tentar de novo
        </Botao>
      )}
    </div>
  );
}

export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="my-6 rounded-md bg-gramado px-5 py-6">
      <p className="font-semibold">{titulo}</p>
      {children && <div className="mt-1 text-tinta-suave">{children}</div>}
    </div>
  );
}
