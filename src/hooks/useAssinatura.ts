import { useEffect, useState } from "react";

export type Assinar<T> = (
  aoMudar: (dados: T) => void,
  aoFalhar: (erro: Error) => void,
) => () => void;

export type EstadoAssinatura<T> =
  { status: "carregando" } | { status: "erro"; erro: Error } | { status: "pronto"; dados: T };

/**
 * Mantém uma assinatura em tempo real (ex.: um listener do Firestore) enquanto o
 * componente está montado. Mudar `chave` refaz a assinatura e volta a "carregando".
 */
export function useAssinatura<T>(
  assinar: Assinar<T>,
  chave: string | number = 0,
): EstadoAssinatura<T> {
  const [estado, setEstado] = useState<{ chave: string | number; valor: EstadoAssinatura<T> }>({
    chave,
    valor: { status: "carregando" },
  });

  useEffect(
    () =>
      assinar(
        (dados) => setEstado({ chave, valor: { status: "pronto", dados } }),
        (erro) => setEstado({ chave, valor: { status: "erro", erro } }),
      ),
    [assinar, chave],
  );

  return estado.chave === chave ? estado.valor : { status: "carregando" };
}
